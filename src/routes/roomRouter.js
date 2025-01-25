const roomsController = require("../controllers/roomController");
const gameController = require("../controllers/gameController");
const express = require("express");
const router = express.Router();

router.post("/", roomsController.create);
router.get("/", roomsController.getMain);
router.get("/roomList", roomsController.getRoomList);
router.put("/:roomId", roomsController.join);
router.get("/:roomId", roomsController.getRoom);
router.get("/:roomId/game", gameController.getGame);

module.exports = router;
