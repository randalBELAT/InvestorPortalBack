const server = require('../index.js');
const request = require('supertest'); //SuperTest is used to test the Express application without starting the server 

describe("GET /api/v1/getIncomeRanges", () => {

    test("Should respond with a 200 status code and the filtered income ranges", async () => {
        const response = await request(server)
            .get("/api/v1/getIncomeRanges")
            .query({ id_country: 39 });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("incomeRanges");
        expect(Array.isArray(response.body.incomeRanges)).toBe(true);

        // Additional checks to ensure the filtered results match the provided country ID
        response.body.incomeRanges.forEach(incomeRange => {
            expect(incomeRange.id_country).toBe(39);
        });
    });

    test("Should respond with 400 if country code format is invalid", async () => {
        const response = await request(server)
            .get("/api/v1/getIncomeRanges")
            .query({ id_country: "abc" });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error", "Country code format is invalid");
    });

    test("Should respond with 404 if no income ranges exist for the provided country", async () => {
        const response = await request(server)
            .get("/api/v1/getIncomeRanges")
            .query({ id_country: 999 });

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("error", "No existing income range for the country");
    });

    
});








afterAll(() => {
    server.close();
});