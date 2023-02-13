const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

function convertStateTable(obj) {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
}

function convertDistrictTable(obj) {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
}

function convertStateName(obj) {
  return {
    stateName: obj.state_name,
  };
}

//getStatesList
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray.map((each) => convertStateTable(each)));
});

//getState
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
      *
    FROM
      state
    WHERE
      state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertStateTable(state));
});

//AddDistrict
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
  const addDistrictQuery = `
    INSERT INTO
      district (district_name,state_id,cases,cured,active,deaths)
    VALUES
      (
       '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
      );`;

  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//getDistrict
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
      *
    FROM
      district
    WHERE
      district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictTable(district));
});

//deleteDistrict
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM
        district
    WHERE
        district_id = ${districtId};`;

  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//UpdateDistrict
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

  const updateDistrictQuery = `
    UPDATE
      district
    SET
      district_name='${districtName}',
      state_id=${stateId},
      cases=${cases},
      cured=${cured},
      active=${active},
      deaths=${deaths}
    WHERE
      district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//totalcases
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const totalQuery = `SELECT sum(cases) as totalCases,sum(cured) as totalCured,
    sum(active) as totalActive,sum(deaths) as totalDeaths
    FROM district
    where state_id=${stateId};`;
  const responseObj = await db.get(totalQuery);
  response.send(responseObj);
});

//getStatebyDistrictId
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `SELECT state_name FROM state join district 
  ON state.state_id=district.state_id
  WHERE district.district_id=${districtId};`;
  const responseObj = await db.get(getStateQuery);
  response.send(convertStateName(responseObj));
});
module.exports = app;
