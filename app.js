const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndserver = async () => {
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

initializeDBAndserver();

// To GET all states.

app.get("/states/", async (request, response) => {
  const statesQuery = `SELECT * FROM state ORDER BY state_id;`;
  const statesArray = await db.all(statesQuery);
  const convertDBObjectToResponse = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };

  response.send(
    statesArray.map((eachItem) => convertDBObjectToResponse(eachItem))
  );
});

//To get state based on stateID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;

  const convertDBObjectToResponse = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };
  const statesArray = await db.get(stateQuery);
  response.send(convertDBObjectToResponse(statesArray));
});

// To Add a district

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const adddistrictQuery = `INSERT INTO district(district_name,state_id,cases,cured , active,deaths) 
                            VALUES ('${districtName}', '${stateId}','${cases}','${cured}', '${active}','${deaths}');`;

  const dbResponse = await db.run(adddistrictQuery);
  const districtId = dbResponse.lastId;
  response.send("District Successfully Added");
});

//To get district based on districtID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const convertDBObjectToResponse = (dbObject) => {
    return {
      districtId: dbObject.district_id,
      districtName: dbObject.district_name,
      stateId: dbObject.state_id,
      cases: dbObject.cases,
      cured: dbObject.cured,
      active: dbObject.active,
      deaths: dbObject.deaths,
    };
  };
  const districtArray = await db.get(districtQuery);
  response.send(convertDBObjectToResponse(districtArray));
});

// To DELETE district table based on the districtID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const DeleteQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(DeleteQuery);
  response.send("District Removed");
});

// To UPDATE district table based on the districtID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const districQuery = `UPDATE district SET district_name = '${districtName}', state_id = '${stateId}' , cases = '${cases}' , cured = '${cured}' , active = '${active}' , deaths = '${deaths}';`;
  await db.run(districQuery);
  response.send("District Details Updated");
});

// To GET total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  console.log(request.params);
  const { stateId } = request.params;

  const getstateQuery = `SELECT SUM(cases), SUM(cured), SUM(active), SUM(deaths) FROM district WHERE state_id = ${stateId};`;

  const stats = await db.get(getstateQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

// To Get  state name of a district based on the districtID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `SELECT state_id FROM district WHERE district_id = '${districtId}';`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  console.log(getDistrictIdQuery);
  const getStateNameQuery = `SELECT state_name as stateName FROM state WHERE state_id = '${getDistrictIdQueryResponse.state_id}';`;
  console.log(getStateNameQuery);
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
