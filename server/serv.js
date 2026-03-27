const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// THIS must match your frontend
app.post("/api/analyze", (req, res) => {
    const data = req.body;

    console.log("==== DATA FROM FRONTEND ====");
    console.log(JSON.stringify(data, null, 2));

    // Dummy response matching our frontend expectation
    const response = {
        urgency: "low",
        urgency_msg: "No immediate danger detected",

        conditions: [
            {
                name: "Common Cold",
                pct: 75,
                severity: "low",
                icd: "J00",
                desc: "Mild viral infection"
            }
        ],

        specialists: ["General Physician"],

        doctors: [
            {
                name: "Dr. Sharma",
                spec: "General Physician",
                hospital: "City Hospital",
                exp: "5 years",
                rating: "4.5",
                dist: "2 km",
                avail: true
            }
        ],

        drugs: [
            {
                name: "Paracetamol",
                class: "Analgesic",
                mechanism: "Reduces fever and pain",
                dosage: "500mg",
                formulation: "Tablet",
                caution: "Avoid overdose"
            }
        ]
    };

    res.json(response);
});

app.listen(8080, () => {
    console.log("Server running at http://localhost:8080");
});