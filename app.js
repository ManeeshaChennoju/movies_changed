const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;
const convertMovieTable = (db_object) => {
  return {
    movieId: db_object.movie_id,
    directorId: db_object.director_id,
    movieName: db_object.movie_name,
    leadActor: db_object.lead_actor,
  };
};
const convertDirectorTable = (dir_obj) => {
  return {
    directorId: dir_obj.director_id,
    directorName: dir_obj.director_name,
  };
};
const convertMovieName = (obj) => {
  return {
    movieName: obj.movie_name,
  };
};

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/movies/", async (request, response) => {
  const getMoviesListQuery = `SELECT movie_name FROM movie;`;
  const moviesList = await db.all(getMoviesListQuery);
  const changedMoviesList = [];
  for (let obj of moviesList) {
    changedMoviesList.push(convertMovieTable(obj));
  }
  response.send(changedMoviesList);
});

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `INSERT INTO movie (director_id, movie_name, lead_actor)
    VALUES('${directorId}', '${movieName}', '${leadActor}');`;
  const dbResponse = await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `SELECT * FROM movie WHERE movie_id = '${movieId}';`;
  const movie = await db.get(getMovieQuery);
  response.send(convertMovieTable(movie));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `UPDATE movie SET 
    director_id = '${directorId}', movie_name = '${movieName}', lead_actor = '${leadActor}';`;
  const dbResponse = await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `DELETE FROM movie WHERE movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `SELECT * FROM director ORDER BY director_id;`;
  const directorsList = await db.all(getDirectorsQuery);
  const changedDirectorsLis = [];
  for (let director of directorsList) {
    changedDirectorsLis.push(convertDirectorTable(director));
  }
  response.send(changedDirectorsLis);
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieQuery = `SELECT movie_name as movieName FROM movie where director_id = ${directorId}`;
  const moviesNamesLis = await db.all(getMovieQuery);
  response.send(moviesNamesLis);
});

module.exports = app;
