import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const prisma = new PrismaClient();

const app = express();
const server = createServer(app);
const io = new Server(server);
var users = [];
var databaseUsers = [];

async function loadUsersFromDatabase() {
    databaseUsers = await prisma.users.findMany();
    console.log(databaseUsers);
    for (let i = 0, len = databaseUsers.length; i < len; i++) {
        users.push({
            socketID: databaseUsers[i].socketID,
            username: databaseUsers[i].username,
        });
    }
}

async function addUsersToDatabase() {
    databaseUsers = await prisma.users.findMany();
    users.forEach(async (user) => {
        if (databaseUsers.find((u) => u.username === user.username)) {
            console.log("user already in database: " + user.username);
            return;
        } else {
            console.log("adding user to database: " + user.username);
            await prisma.users.create({
                data: {
                    socketID: user.socketID,
                    username: user.username,
                    notification: {
                        create: [
                            {
                                header: "Welcome",
                                message: "Welcome to the chat app",
                                sender: "Admin",
                            },
                        ],
                    },
                },
            });
        }
    });
}

async function updateUsersInDatabase() {
    users.forEach(async (user) => {
        if (databaseUsers.find((u) => u.username === user.username)) {
            console.log("updating user in database: " + user.username);
            await prisma.users.update({
                where: {
                    username: user.username,
                },
                data: {
                    socketID: user.socketID,
                },
            });
        } else {
            console.log("user not in database: " + user.username);
        }
    });
}

async function addNotificationToDatabase(message) {
    await prisma.notification.create({
        data: {
            header: message.header,
            message: message.message,
            sender: message.sender,
            users: {
                connect: {
                    username: message.receiver,
                },
            },
        },
    });
}

async function getMessagesFromDatabase() {
    return await prisma.notification.findMany();
}

loadUsersFromDatabase();

var __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'receiver.html'));
});

io.on('connection', (socket) => {
    console.log('a user connected');
    for (let [id, socket] of io.of("/").sockets) {
        if (!users.find((u) => u.username === socket.username)) {
            users.push({
                socketID: id,
                username: socket.username,
            });
        } else {
            if (users.find((u) => u.username === socket.username)) {
                users.find((u) => u.username === socket.username).socketID = id;
            }
        }
    }
    addUsersToDatabase();
    updateUsersInDatabase();
    socket.emit("users", users);
    console.log(users);

    socket.on('disconnect', () => {
        console.log('user disconnected');
        updateUsersInDatabase();
    });

    socket.onAny((event, ...args) => {
        console.log('onAny' + event, args);
    });

    socket.on('message', (msg) => {
        for (let i = 0, len = users.length; i < len; i++) {
            if (users[i].username === msg.receiver) {
                console.log('sending message to: ' + users[i].socketID);
                socket.to(users[i].socketID).emit("notification", {
                    from: socket.username,
                    header: msg.header,
                    message: msg.message,
                });
                addNotificationToDatabase(msg);
                break;
            }
        }
    });

    socket.on('refresh', async () => {
        const messages = await getMessagesFromDatabase();
        addUsersToDatabase();
        updateUsersInDatabase();
        socket.emit('refresh', {
            messages: messages,
            users: databaseUsers,
        });
    });
});

io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
});

io.on('turn off', (socket) => {
    console.log('turn off');
    prisma.$disconnect();
    process.exit(1);
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
