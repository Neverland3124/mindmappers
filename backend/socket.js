export function registerIOListeners(io) {
  // listeners
  io.on("connection", (socket) => {
    // when someone connects, they are assigned a socket object.
    console.log("a user connected");

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
}