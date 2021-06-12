const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;
const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertPlayerDbToResponseDatabase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDbToResponseDatabase = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//Get All Players API
app.get("/players/", async (request, response) => {
  const playersQuery = `SELECT * FROM player_details;`;
  const players = await database.all(playersQuery);
  response.send(
    players.map((eachPlayer) => convertPlayerDbToResponseDatabase(eachPlayer))
  );
});
//Get Player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const player = await database.get(playerQuery);
  response.send(convertPlayerDbToResponseDatabase(player));
});
//Update Player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name ='${playerName}'
  WHERE
    player_id = ${playerId};`;

  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
//Get Match API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const match = await database.get(matchQuery);
  response.send(convertMatchDbToResponseDatabase(match));
});
//Get Player Match API
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id=${playerId};`;
  const playerMatch = await database.all(playerMatchQuery);
  response.send(
    playerMatch.map((player) => convertMatchDbToResponseDatabase(player))
  );
});
//Get Match Player API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchPlayerQuery = `SELECT * FROM player_details NATURAL JOIN player_match_score WHERE match_id=${matchId};`;
  const matchPlayer = await database.all(matchPlayerQuery);
  response.send(
    matchPlayer.map((item) => convertPlayerDbToResponseDatabase(item))
  );
});
//Get Player Stats API

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await database.get(getMatchPlayersQuery);
  response.send(playersMatchDetails);
});
module.exports = app;
