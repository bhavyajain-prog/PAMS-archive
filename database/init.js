db = db.getSiblingDB("pams");
db.createUser({
  user: process.env.APP_USERNAME,
  pwd: process.env.APP_PASSWORD,
  roles: [
    {
      role: "readWrite",
      db: "pams",
    },
  ],
});
print("Database initialized successfully");
