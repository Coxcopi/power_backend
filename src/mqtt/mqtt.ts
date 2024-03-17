import Aedes from "aedes";
import { createServer } from "net";

const port = 1883;

const aedes = new Aedes();
const server = createServer(aedes.handle);

server.listen(port, function() {
    console.log("Aedes server started.");
})

aedes.on("client", (client) => {
    console.log("Client registered.");
});

aedes.on("clientReady", (client) => {
    console.log("Client ready");
})

aedes.on("publish", (packet, client) => {
    console.log(packet);
})