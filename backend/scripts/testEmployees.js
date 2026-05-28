import assert from "node:assert/strict";
import dotenv from "dotenv";
import dns from "dns";
import mongoose from "mongoose";
import app from "../app.js";
import Employee from "../models/Employee.js";
import { seedEmployees } from "./seedEmployees.js";

dotenv.config();
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const requestJson = async (baseUrl, path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const body = await response.json();
  return { response, body };
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  await seedEmployees();

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const all = await requestJson(baseUrl, "/api/employees");
    assert.equal(all.response.status, 200, "GET /api/employees should return 200");
    assert.ok(all.body.data.length >= 5, "employee list should include seeded demo employees");

    const search = await requestJson(baseUrl, "/api/employees?search=aarav");
    assert.equal(search.response.status, 200, "search should return 200");
    assert.ok(
      search.body.data.some((employee) => employee.email === "aarav.fernando@demo.sems.local"),
      "search should find Aarav Fernando"
    );

    const filtered = await requestJson(
      baseUrl,
      "/api/employees?department=Engineering&designation=Software%20Engineer"
    );
    assert.equal(filtered.response.status, 200, "department/designation filter should return 200");
    assert.ok(
      filtered.body.data.every(
        (employee) =>
          employee.department.toLowerCase() === "engineering" &&
          employee.designation.toLowerCase() === "software engineer"
      ),
      "combined filters should only return engineering software engineers"
    );

    const createPayload = {
      firstName: "Api",
      lastName: "Tester",
      email: "api.tester@demo.sems.local",
      phone: "+94 77 200 2000",
      department: "IT",
      designation: "Analyst",
      salary: 50000,
      status: "Active",
    };

    await Employee.deleteOne({ email: createPayload.email });

    const created = await requestJson(baseUrl, "/api/employees", {
      method: "POST",
      body: JSON.stringify(createPayload),
    });
    assert.equal(created.response.status, 201, "POST /api/employees should create an employee");
    assert.equal(created.body.data.email, createPayload.email);

    const duplicate = await requestJson(baseUrl, "/api/employees", {
      method: "POST",
      body: JSON.stringify(createPayload),
    });
    assert.equal(duplicate.response.status, 409, "duplicate email should return 409");

    const employeeId = created.body.data._id;
    const updated = await requestJson(baseUrl, `/api/employees/${employeeId}`, {
      method: "PUT",
      body: JSON.stringify({ department: "Operations", designation: "Manager" }),
    });
    assert.equal(updated.response.status, 200, "PUT /api/employees/:id should update an employee");
    assert.equal(updated.body.data.department, "Operations");
    assert.equal(updated.body.data.designation, "Manager");

    const deleted = await requestJson(baseUrl, `/api/employees/${employeeId}`, {
      method: "DELETE",
    });
    assert.equal(deleted.response.status, 200, "DELETE /api/employees/:id should delete an employee");

    const afterDelete = await requestJson(baseUrl, `/api/employees/${employeeId}`);
    assert.equal(afterDelete.response.status, 404, "deleted employee should not be found");

    console.log("Employee API tests passed.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
