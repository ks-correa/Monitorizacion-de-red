db = db.getSiblingDB("gastosmart");
db.createCollection("healthchecks");
db.healthchecks.insertOne({
  service: "gastosmart-mongodb",
  initializedAt: new Date()
});
