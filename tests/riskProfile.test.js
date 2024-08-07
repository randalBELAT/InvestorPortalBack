const server = require('../index.js');
const request = require('supertest'); 
const { PrismaClient } = require('@prisma/client');

// Mockear PrismaClient para evitar el acceso a la base de datos real
jest.mock('@prisma/client', () => {

    const { mockPrismaClient } = require('../utils/mocks.js');
    
    return { PrismaClient: jest.fn(() => mockPrismaClient) };
});


const prismaMock = new PrismaClient();


describe("PUT /api/v1/UpdateRiskProfileScale", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Should respond with 200 and update the risk profile scale", async () => {
        // Mock data
        const mockUpdatedRiskProfile = {
            id_risk_profile: 1,
            id_scales: 1,
            id_investment_account_natural: 1,
            total_score: 20, // Assuming total_score remains the same in the update
        };

        // Mock responses from Prisma
        prismaMock.investment_Account_Natural.findUnique.mockResolvedValueOnce({ id_investment_account_natural: 1 });
        prismaMock.scales.findFirst.mockResolvedValueOnce({ id_scales: 1 });
        prismaMock.risk_Profile.findFirst.mockResolvedValueOnce({
            id_risk_profile: 1,
            id_scales: 2, // Assuming the initial scales ID is different
            id_investment_account_natural: 1,
            total_score: 20,
        });

        prismaMock.risk_Profile.update.mockResolvedValueOnce(mockUpdatedRiskProfile);

        // Send request to the server
        const response = await request(server)
            .put("/api/v1/UpdateRiskProfileScale")
            .send({ id_investment_account_natural: 1, id_scales: 1 });

        // Assertions
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ ok: true, updatedRiskProfile: mockUpdatedRiskProfile });
    });

    test("Should respond with 404 if investment account does not exist", async () => {
        prismaMock.investment_Account_Natural.findUnique.mockResolvedValueOnce(null);

        const response = await request(server)
            .put("/api/v1/UpdateRiskProfileScale")
            .send({ id_investment_account_natural: 1, id_scales: 1 });

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({ error: 'Investment account does not exist' });
    });

    test("Should respond with 404 if scales ID does not exist", async () => {
        prismaMock.investment_Account_Natural.findUnique.mockResolvedValueOnce({ id_investment_account_natural: 1 });
        prismaMock.scales.findFirst.mockResolvedValueOnce(null);

        const response = await request(server)
            .put("/api/v1/UpdateRiskProfileScale")
            .send({ id_investment_account_natural: 1, id_scales: 1 });

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({ error: 'Scales ID does not exist' });
    });

    test("Should respond with 404 if no risk profile found for the provided investment account natural", async () => {
        prismaMock.investment_Account_Natural.findUnique.mockResolvedValueOnce({ id_investment_account_natural: 1 });
        prismaMock.scales.findFirst.mockResolvedValueOnce({ id_scales: 1 });
        prismaMock.risk_Profile.findFirst.mockResolvedValueOnce(null);

        const response = await request(server)
            .put("/api/v1/UpdateRiskProfileScale")
            .send({ id_investment_account_natural: 1, id_scales: 1 });

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({ error: 'No risk profile found with the provided investment account natural.' });
    });

    test("Should respond with 200 and message 'The risk profile scale is already up to date.' if scales ID is the same", async () => {
        const existingRiskProfile = {
            id_risk_profile: 1,
            id_scales: 1,
            id_investment_account_natural: 1,
            total_score: 20,
        };

        prismaMock.investment_Account_Natural.findUnique.mockResolvedValueOnce({ id_investment_account_natural: 1 });
        prismaMock.scales.findFirst.mockResolvedValueOnce({ id_scales: 1 });
        prismaMock.risk_Profile.findFirst.mockResolvedValueOnce(existingRiskProfile);

        const response = await request(server)
            .put("/api/v1/UpdateRiskProfileScale")
            .send({ id_investment_account_natural: 1, id_scales: 1 });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ ok: true, message: 'The risk profile scale is already up to date.' });
    });
});

describe("GET /api/v1/getRiskProfile", () => {

  beforeEach(() => {
      jest.clearAllMocks();
  });

  test("Should respond with 200 and return existing risk profiles", async () => {
      const existingRiskProfiles = [
          { id_risk_profile: 1, id_investment_account_natural: 1, id_scales: 1 },
          { id_risk_profile: 2, id_investment_account_natural: 1, id_scales: 2 },
      ];
      prismaMock.investment_Account_Natural.findUnique.mockResolvedValueOnce({ id_investment_account_natural: 1 });
      prismaMock.risk_Profile.findMany.mockResolvedValueOnce(existingRiskProfiles);

      const response = await request(server)
          .get("/api/v1/getRiskProfile")
          .query({ id_investment_account_natural: 1 });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(existingRiskProfiles);
  });

  test("Should respond with 404 if natural investment account does not exist", async () => {
    prismaMock.investment_Account_Natural.findUnique.mockResolvedValueOnce(null);

    const response = await request(server)
        .get("/api/v1/getRiskProfile")
        .query({ id_investment_account_natural: 1 });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error", "Natural investment account not found");
});

test("Should respond with 404 if no risk profiles found for the specified account", async () => {
    prismaMock.investment_Account_Natural.findUnique.mockResolvedValueOnce({ id_investment_account_natural: 1 });
    prismaMock.risk_Profile.findMany.mockResolvedValueOnce([]);

    const response = await request(server)
        .get("/api/v1/getRiskProfile")
        .query({ id_investment_account_natural: 1 });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error", "No risk profiles found for the specified account");
});

});

describe("POST /api/v1/postRiskProfileForAccount", () => {

    beforeEach(() => {
        jest.clearAllMocks();

    });

    test("Should respond with 200 and create the risk profile successfully", async () => {
    // Configuración de mocks para las consultas de Prisma
    prismaMock.investment_Account_Natural.findUnique.mockResolvedValue({
        id_investment_account_natural: 1,
    });

    prismaMock.risk_Profile.findFirst.mockResolvedValue(null);
    
    prismaMock.risk_Profile_Question_Selection.count.mockResolvedValue(6);

    prismaMock.scales.findMany.mockResolvedValue([
        {id_scales: 1, min_value: 1, max_value: 12},
        {id_scales: 2, min_value: 13, max_value: 20}
    ])

    prismaMock.risk_Profile_Question_Selection.findMany.mockResolvedValue([
      { id_investment_account_natural: 1, id_responses_risk_profile: 2 },
      { id_investment_account_natural: 1, id_responses_risk_profile: 6 },
      { id_investment_account_natural: 1, id_responses_risk_profile: 10 },
      { id_investment_account_natural: 1, id_responses_risk_profile: 14 },
      { id_investment_account_natural: 1, id_responses_risk_profile: 18 },
      { id_investment_account_natural: 1, id_responses_risk_profile: 23 },
    ]);

    prismaMock.responses_Risk_Profile.findMany.mockResolvedValue([
      { id_responses_risk_profile: 2, associated_response_score: 3 },
      { id_responses_risk_profile: 6, associated_response_score: 3 },
      { id_responses_risk_profile: 10, associated_response_score: 3 },
      { id_responses_risk_profile: 14, associated_response_score: 3 },
      { id_responses_risk_profile: 18, associated_response_score: 3 },
      { id_responses_risk_profile: 23, associated_response_score: 5 },
    ]);

    prismaMock.risk_Profile.create.mockResolvedValue({ id_risk_profile: 1, total_score: 10, id_scales: 1 });

    // Realización de la solicitud HTTP POST
    const response = await request(server)
      .post('/api/v1/postRiskProfileForAccount')
      .send({ id_investment_account_natural: '1' });

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, createdRiskProfile: { id_risk_profile: 1, total_score: 10, id_scales: 1 } });
  });

  test("Should respond with 404 if natural investment account does not exist", async () => {
    prismaMock.investment_Account_Natural.findUnique.mockResolvedValueOnce(null);

    const response = await request(server)
        .post("/api/v1/postRiskProfileForAccount")
        .send({ id_investment_account_natural: 1 });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error", "Natural investment account not found");
  });

  test("Should respond with 409 if risk profile already exists for the account", async () => {
    prismaMock.investment_Account_Natural.findUnique.mockResolvedValueOnce({ id_investment_account_natural: 1 });
    prismaMock.risk_Profile.findFirst.mockResolvedValueOnce({ id_risk_profile: 1 });

    const response = await request(server)
        .post("/api/v1/postRiskProfileForAccount")
        .send({ id_investment_account_natural: 1 });

    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty("error", "Risk profile already exists for this account. Please update the existing risk profile");
  });

  test("Should respond with 400 if not all risk profile questions are answered", async () => {
    prismaMock.investment_Account_Natural.findUnique.mockResolvedValueOnce({ id_investment_account_natural: 1 });
    prismaMock.risk_Profile.findFirst.mockResolvedValueOnce(null); // No existing risk profile
    prismaMock.risk_Profile_Question_Selection.count.mockResolvedValueOnce(5); // Invalid answers count

    const response = await request(server)
        .post("/api/v1/postRiskProfileForAccount")
        .send({ id_investment_account_natural: 1 });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error", "Please answer all 6 risk profile questions");
  });
});

describe("GET /api/v1/getScales", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Should respond with 200 and return all risk scales", async () => {
        const scales = [
            { id_scales: 1, scale_name: "Low Risk" },
            { id_scales: 2, scale_name: "Medium Risk" },
            { id_scales: 3, scale_name: "High Risk" },
        ];
        prismaMock.scales.findMany.mockResolvedValueOnce(scales);

        const response = await request(server)
            .get("/api/v1/getScales");

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ scales });
    });

    test("Should respond with 400 if query parameters are provided", async () => {

        const response = await request(server)
            .get("/api/v1/getScales")
            .query({ someQueryParam: "someValue" });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error", "Invalid request. No query parameters allowed.");
    });

});

describe("POST /api/v1/postRiskProfileQuestionSelection", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Should respond with 200 and create risk profile question selection", async () => {
        const requestBody = {
            id_investment_account_natural: 1,
            id_responses_risk_profile: 2
        };
        
        const relatedQuestion = { id_risk_profile_questions: 3 };
        const createdRiskProfileQuestionSelection = {
            id_risk_profile_question_selection: 1,
            id_investment_account_natural: 1,
            id_responses_risk_profile: 2
        };

        prismaMock.responses_Risk_Profile.findUnique.mockResolvedValueOnce(relatedQuestion);
        prismaMock.responses_Risk_Profile.findMany.mockResolvedValueOnce([]);
        prismaMock.risk_Profile_Question_Selection.findMany.mockResolvedValueOnce([]);
        prismaMock.risk_Profile_Question_Selection.create.mockResolvedValueOnce(createdRiskProfileQuestionSelection);

        const response = await request(server)
            .post("/api/v1/postRiskProfileQuestionSelection")
            .send(requestBody);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ ok: true, data: createdRiskProfileQuestionSelection });
    });
});

describe("GET /api/v1/getRiskProfileQuestionSelection", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Should respond with 200 and return risk profile question selections", async () => {
        const riskProfileQuestionSelection = [
            { id_risk_profile_question_selection: 1, id_investment_account_natural: 1, responses_risk_profile: [] },
            { id_risk_profile_question_selection: 2, id_investment_account_natural: 1, responses_risk_profile: [] },
        ];
        prismaMock.risk_Profile_Question_Selection.findMany.mockResolvedValueOnce(riskProfileQuestionSelection);

        const response = await request(server)
            .get("/api/v1/getRiskProfileQuestionSelection")
            .query({ id_investment_account_natural: 1 });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(riskProfileQuestionSelection);
    });

    test("Should respond with 404 if no risk profile answers found", async () => {
        prismaMock.risk_Profile_Question_Selection.findMany.mockResolvedValueOnce([]);

        const response = await request(server)
            .get("/api/v1/getRiskProfileQuestionSelection")
            .query({ id_investment_account_natural: 1 });

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("error", "No risk profile answers found");
    });

});

describe("GET /api/v1/getAnswersRiskQuestions", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Should respond with 200 and return filtered answers", async () => {
        const answers = [
            {
                id_response_risk_profile: 1,
                id_risk_profile_questions: 1,
                answer: 'Answer 1',
                risk_profile_questions: {
                    id_country: 1
                }
            },
            {
                id_response_risk_profile: 2,
                id_risk_profile_questions: 1,
                answer: 'Answer 2',
                risk_profile_questions: {
                    id_country: 1
                }
            }
        ];

        prismaMock.responses_Risk_Profile.findMany.mockResolvedValueOnce(answers);

        const response = await request(server)
            .get("/api/v1/getAnswersRiskQuestions")
            .query({ id_country: 1, id_risk_profile_questions: 1 });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(answers);
    });

    test("Should respond with 404 if no answers are found for the specified country", async () => {
        const answers = [
            {
                id_response_risk_profile: 1,
                id_risk_profile_questions: 1,
                answer: 'Answer 1',
                risk_profile_questions: {
                    id_country: 2
                }
            }
        ];

        prismaMock.responses_Risk_Profile.findMany.mockResolvedValueOnce(answers);

        const response = await request(server)
            .get("/api/v1/getAnswersRiskQuestions")
            .query({ id_country: 1, id_risk_profile_questions: 1 });

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("error", "No answers found for the specified country");
    });

    test("Should respond with 404 if no answers are found for the specified question", async () => {
        prismaMock.responses_Risk_Profile.findMany.mockResolvedValueOnce([]);

        const response = await request(server)
            .get("/api/v1/getAnswersRiskQuestions")
            .query({ id_country: 1, id_risk_profile_questions: 1 });

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("error", "No answers found for the specified question");
    });

});

describe("GET /api/v1/getRiskProfileQuestions", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Should respond with 200 and return the risk profile questions for the specified country and question ID", async () => {
        const riskProfileQuestions = [
            { id_risk_profile_questions: 1, id_country: 1, question_text: "Sample Question 1" },
        ];
        prismaMock.risk_Profile_Questions.findMany.mockResolvedValueOnce(riskProfileQuestions).mockResolvedValueOnce(riskProfileQuestions).mockResolvedValueOnce(riskProfileQuestions);

        const response = await request(server)
            .get("/api/v1/getRiskProfileQuestions")
            .query({ id_country: 1, id_risk_profile_questions: 1 });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ ok: true, getQuestions: riskProfileQuestions });
    });

    test("Should respond with 404 if no risk profile questions found for the specified country ID", async () => {
        prismaMock.risk_Profile_Questions.findMany.mockResolvedValueOnce([]);

        const response = await request(server)
            .get("/api/v1/getRiskProfileQuestions")
            .query({ id_country: 1, id_risk_profile_questions: 1 });

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("error", "No risk profile questions found for the specified country ID");
    });

    test("Should respond with 404 if no risk profile questions found for the specified question ID", async () => {
        prismaMock.risk_Profile_Questions.findMany.mockResolvedValueOnce([{ id_risk_profile_questions: 1, id_country: 1 }]).mockResolvedValueOnce([]);

        const response = await request(server)
            .get("/api/v1/getRiskProfileQuestions")
            .query({ id_country: 1, id_risk_profile_questions: 2 });

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("error", "No risk profile questions found for the specified question ID");
    });

});


afterAll(() => {
  server.close();
 });