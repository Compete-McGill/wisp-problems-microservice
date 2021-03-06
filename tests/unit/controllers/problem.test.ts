import sinon from "sinon";
import { problemController } from "../../../src/controllers/problem";
import { problemDBInteractionsStubs } from "../stubs/problem";
import { problemSetDBInteractionsStubs } from "../stubs/problemSet";
import { mockReq, mockRes } from "sinon-express-mock";
import {
    validatorStubs,
    validationErrorWithMessage,
    emptyValidationError
} from "../stubs/validator";
import {
    testProblemModel1,
    testProblem1,
    testProblemModel2,
    testProblem2
} from "../../util/sampleData";
import { statusCodes } from "../../../src/config/statusCodes";
import { problemUtilStubs } from "../stubs/util";
import { IProblem, PlatformName } from "../../../src/interfaces/IProblem";
import { IProblemModel } from "../../../src/database/models/problem";

// Initialized outside of "describe" blocks to ensure typesafety + intellisense
let stubs = {
    problemDB: problemDBInteractionsStubs(),
    problemSetDB: problemSetDBInteractionsStubs(),
    problemUtil: problemUtilStubs(),
    validators: validatorStubs()
};

stubs.problemDB.restore();
stubs.problemSetDB.restore();
stubs.problemUtil.restore();
stubs.validators.restore();

describe("Problems controller tests", () => {
    before(() => {
        stubs = {
            problemDB: problemDBInteractionsStubs(),
            problemSetDB: problemSetDBInteractionsStubs(),
            problemUtil: problemUtilStubs(),
            validators: validatorStubs()
        };
    });

    beforeEach(() => {
        mockRes.status = sinon.stub().returns(mockRes);
        mockRes.json = sinon.stub().returns(mockRes);
    });

    afterEach(() => {
        sinon.reset();
    });

    after(() => {
        stubs.problemDB.restore();
        stubs.problemSetDB.restore();
        stubs.problemUtil.restore();
        stubs.validators.restore();
    });

    describe("Index", () => {
        it("status 200: returns successfully a list of a single tests problem", async () => {
            stubs.problemDB.all.resolves([testProblemModel1]);
            await problemController.index(mockReq, mockRes);
            sinon.assert.calledOnce(stubs.problemDB.all);
            sinon.assert.calledWith(mockRes.status, 200);
            sinon.assert.calledWith(mockRes.json, [testProblemModel1]);
        });

        it("status 500: returns server error code if server fails", async () => {
            stubs.problemDB.all.throws();
            await problemController.index(mockReq, mockRes);
            sinon.assert.calledOnce(stubs.problemDB.all);
            sinon.assert.calledWith(mockRes.status, 500);
        });
    });

    describe("Show", () => {
        let req;
        beforeEach(() => {
            req = mockReq({
                params: {}
            });
        });

        it("status 200: returns successfully a single problem", async () => {
            stubs.problemDB.find.resolves(testProblemModel1);
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            req.params.problemId = testProblemModel1._id;
            await problemController.show(req, mockRes);

            sinon.assert.calledOnce(stubs.problemDB.find);
            sinon.assert.calledWith(
                stubs.problemDB.find,
                testProblemModel1._id
            );
            sinon.assert.calledWith(mockRes.status, statusCodes.SUCCESS);
            sinon.assert.calledWith(mockRes.json, testProblemModel1);
        });

        it("status 404: returns an appropriate response if problem doesn't exist", async () => {
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            req.params.problemId = "testNonexistantId";
            await problemController.show(req, mockRes);

            sinon.assert.calledOnce(stubs.problemDB.find);
            sinon.assert.calledWith(stubs.problemDB.find, req.params.problemId);
            sinon.assert.calledWith(mockRes.status, statusCodes.NOT_FOUND);
            sinon.assert.calledWith(mockRes.json, {
                status: statusCodes.NOT_FOUND,
                message: "Problem not found"
            });
        });

        it("status 422: returns an appropriate response with validation error", async () => {
            const errorMsg = {
                status: statusCodes.MISSING_PARAMS,
                message: "params[problemId]: Invalid or missing ':problemId'"
            };
            stubs.validators.validationResult.returns(
                <any>validationErrorWithMessage(errorMsg)
            );

            req.params.problemId = "testInvalidId";
            await problemController.show(req, mockRes);

            sinon.assert.calledOnce(stubs.validators.validationResult);
            sinon.assert.calledWith(mockRes.status, statusCodes.MISSING_PARAMS);
            sinon.assert.calledWith(mockRes.json, errorMsg);
        });

        it("status 500: returns server error if server fails", async () => {
            stubs.problemDB.find.throws();
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );
            req.params.problemId = "exampleProblemMongoId1";
            await problemController.show(req, mockRes);
            sinon.assert.calledOnce(stubs.problemDB.find);
            sinon.assert.calledWith(stubs.problemDB.find, req.params.problemId);
            sinon.assert.calledWith(mockRes.status, statusCodes.SERVER_ERROR);
        });
    });

    describe("Exists", () => {
        let req;
        beforeEach(() => {
            req = mockReq({});
        });

        it("status 200: returns successfully if problem exists", async () => {
            stubs.problemDB.findByGeneratedId.resolves(testProblemModel1);
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            req.params.generatedProblemId = testProblemModel1.problemId;

            await problemController.exists(req, mockRes);

            sinon.assert.calledOnce(stubs.problemDB.findByGeneratedId);

            sinon.assert.calledWith(
                stubs.problemDB.findByGeneratedId,
                testProblemModel1.problemId
            );
            sinon.assert.calledWith(mockRes.status, statusCodes.SUCCESS);
            sinon.assert.calledWith(mockRes.json, testProblemModel1);
        });

        it("status 404: returns an appropriate response if problem doesn't exist", async () => {
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            req.params.generatedProblemId = "nonexistantId";

            await problemController.exists(req, mockRes);

            sinon.assert.calledOnce(stubs.problemDB.findByGeneratedId);

            sinon.assert.calledWith(
                stubs.problemDB.findByGeneratedId,
                req.params.generatedProblemId
            );
            sinon.assert.calledWith(mockRes.status, statusCodes.NOT_FOUND);
            sinon.assert.calledWith(mockRes.json, {
                status: statusCodes.NOT_FOUND,
                message: "Problem not found"
            });
        });

        it("status 422: returns an appropriate response with validation error", async () => {
            const errorMsg = {
                status: statusCodes.MISSING_PARAMS,
                message:
                    "params[generatedProblemId]: Invalid or missing 'generatedProblemId'"
            };
            stubs.validators.validationResult.returns(
                <any>validationErrorWithMessage(errorMsg)
            );

            await problemController.exists(req, mockRes);
            sinon.assert.calledOnce(stubs.validators.validationResult);
            sinon.assert.notCalled(stubs.problemDB.findByGeneratedId);
            sinon.assert.calledWith(mockRes.status, statusCodes.MISSING_PARAMS);
            sinon.assert.calledWith(mockRes.json, errorMsg);
        });

        it("status 500: returns server error if server fails", async () => {
            stubs.problemDB.findByGeneratedId.throws();
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );
            req.params.generatedProblemId = testProblemModel1.problemId;

            await problemController.exists(req, mockRes);
            sinon.assert.calledOnce(stubs.problemDB.findByGeneratedId);
            sinon.assert.calledWith(
                stubs.problemDB.findByGeneratedId,
                req.params.generatedProblemId
            );
            sinon.assert.calledWith(mockRes.status, statusCodes.SERVER_ERROR);
        });
    });

    describe("Create", () => {
        let req;
        beforeEach(() => {
            req = mockReq({});
        });

        it("status 200: returns successfully a created problem with no linked problem sets", async () => {
            stubs.problemDB.create.resolves(testProblemModel2);
            stubs.problemUtil.calculateProblemHash.returns(
                testProblemModel2.problemId
            );
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            req.body = {
                ...testProblem2
            };
            await problemController.create(req, mockRes);
            sinon.assert.calledOnce(stubs.problemDB.create);
            sinon.assert.calledOnce(stubs.problemUtil.calculateProblemHash);
            sinon.assert.calledOnce(stubs.problemSetDB.updateProblemCount);
            sinon.assert.calledWith(
                stubs.problemUtil.calculateProblemHash,
                testProblem2.source,
                testProblem2.problemMetadata.platformProblemId
            );
            const problemToCreate: IProblem = {
                ...req.body,
                problemId: testProblemModel2.problemId
            };
            sinon.assert.calledWith(stubs.problemDB.create, problemToCreate);
            sinon.assert.calledWith(
                stubs.problemSetDB.updateProblemCount,
                testProblemModel2
            );
            sinon.assert.calledWith(mockRes.status, statusCodes.SUCCESS);
            sinon.assert.calledWith(mockRes.json, testProblemModel2);
        });

        it("status 200: returns successfully a created problem with no linked problem sets when source != CODEFORCES", async () => {
            const probModel = <IProblemModel>{
                ...testProblemModel2
            };
            const prob: IProblem = {
                ...testProblem2
            };
            prob.source = PlatformName[1];
            probModel.source = PlatformName[1];
            stubs.problemDB.create.resolves(probModel);
            stubs.problemUtil.calculateProblemHash.returns(probModel.problemId);
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            req.body = {
                ...prob
            };
            await problemController.create(req, mockRes);
            sinon.assert.calledOnce(stubs.problemDB.create);
            sinon.assert.calledOnce(stubs.problemUtil.calculateProblemHash);
            sinon.assert.calledOnce(stubs.problemSetDB.updateProblemCount);
            sinon.assert.calledWith(
                stubs.problemUtil.calculateProblemHash,
                prob.source,
                prob.problemMetadata.platformProblemId
            );
            const problemToCreate: IProblem = {
                ...req.body,
                problemId: probModel.problemId
            };
            sinon.assert.calledWith(stubs.problemDB.create, problemToCreate);
            sinon.assert.calledWith(
                stubs.problemSetDB.updateProblemCount,
                probModel
            );
            sinon.assert.calledWith(mockRes.status, statusCodes.SUCCESS);
            sinon.assert.calledWith(mockRes.json, probModel);
        });

        it("status 200: returns successfully a created problem with linked problem sets", async () => {
            stubs.problemDB.create.resolves(testProblemModel1);
            stubs.problemUtil.calculateProblemHash.returns(
                testProblemModel1.problemId
            );

            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            req.body = {
                ...testProblem1
            };
            await problemController.create(req, mockRes);
            sinon.assert.calledOnce(stubs.problemDB.create);
            sinon.assert.calledOnce(stubs.problemUtil.calculateProblemHash);
            sinon.assert.calledOnce(stubs.problemSetDB.updateProblemCount);

            sinon.assert.calledWith(
                stubs.problemUtil.calculateProblemHash,
                testProblem1.source,
                testProblem1.problemMetadata.platformProblemId
            );
            const problemToCreate: IProblem = {
                ...req.body,
                problemId: testProblemModel1.problemId
            };
            sinon.assert.calledWith(stubs.problemDB.create, problemToCreate);
            sinon.assert.calledWith(
                stubs.problemSetDB.updateProblemCount,
                testProblemModel1
            );
            sinon.assert.calledWith(mockRes.status, statusCodes.SUCCESS);
            sinon.assert.calledWith(mockRes.json, testProblemModel1);
        });

        it("status 422: returns an appropriate response with validation error", async () => {
            const errorMsg = {
                status: statusCodes.MISSING_PARAMS,
                message: "body[title]: Invalid or missing 'title'"
            };
            stubs.validators.validationResult.returns(
                <any>validationErrorWithMessage(errorMsg)
            );
            await problemController.create(req, mockRes);
            sinon.assert.calledOnce(stubs.validators.validationResult);
            sinon.assert.notCalled(stubs.problemDB.create);
            sinon.assert.calledWith(mockRes.status, statusCodes.MISSING_PARAMS);
            sinon.assert.calledWith(mockRes.json, errorMsg);
        });

        it("status 500: returns server error if server fails", async () => {
            stubs.problemDB.create.throws();
            stubs.problemUtil.calculateProblemHash.returns(
                testProblemModel1.problemId
            );
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );
            req.body = {
                ...testProblem1
            };
            await problemController.create(req, mockRes);
            sinon.assert.calledOnce(stubs.problemDB.create);
            sinon.assert.calledOnce(stubs.problemUtil.calculateProblemHash);

            sinon.assert.calledWith(
                stubs.problemUtil.calculateProblemHash,
                testProblem1.source,
                testProblem1.problemMetadata.platformProblemId
            );
            const problemToCreate: IProblem = {
                ...req.body,
                problemId: testProblemModel1.problemId
            };
            sinon.assert.calledWith(stubs.problemDB.create, problemToCreate);
            sinon.assert.calledWith(mockRes.status, statusCodes.SERVER_ERROR);
        });
    });

    describe("Update", () => {
        let req;
        beforeEach(() => {
            req = mockReq({});
        });

        it("status 200: returns successfully an updated problem with no linked problem sets", async () => {
            req.params.problemId = testProblemModel2._id;
            req.body = {
                ...testProblem2
            };
            req.body.title = "Updated title";
            const problemToUpdate: IProblem = {
                ...req.body,
                problemId: testProblemModel2.problemId
            };
            const problemModelToUpdate = <IProblemModel>{
                ...problemToUpdate,
                _id: testProblemModel2._id,
                __v: testProblemModel2.__v
            };

            stubs.problemDB.find.resolves(testProblemModel2);
            stubs.problemDB.update.resolves(problemModelToUpdate);
            stubs.problemUtil.calculateProblemHash.returns(
                testProblemModel2.problemId
            );
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            await problemController.update(req, mockRes);

            sinon.assert.calledOnce(stubs.problemDB.update);
            sinon.assert.calledOnce(stubs.problemUtil.calculateProblemHash);
            sinon.assert.calledOnce(stubs.problemSetDB.updateProblemCount);
            sinon.assert.calledWith(
                stubs.problemUtil.calculateProblemHash,
                testProblem2.source,
                testProblem2.problemMetadata.platformProblemId
            );

            sinon.assert.calledWith(
                stubs.problemDB.update,
                req.params.problemId,
                problemToUpdate
            );
            sinon.assert.calledWith(
                stubs.problemSetDB.updateProblemCount,
                problemModelToUpdate
            );
            sinon.assert.calledWith(mockRes.status, statusCodes.SUCCESS);
            sinon.assert.calledWith(mockRes.json, problemModelToUpdate);
        });

        it("status 200: returns successfully an updated problem with no linked problem sets and source != CODEFORCES", async () => {
            const probModel = <IProblemModel>{
                ...testProblemModel2
            };
            const prob: IProblem = {
                ...testProblem2
            };
            prob.source = PlatformName[1];
            probModel.source = PlatformName[1];

            req.params.problemId = probModel._id;
            req.body = {
                ...prob
            };
            req.body.title = "Updated title";
            const problemToUpdate: IProblem = {
                ...req.body,
                problemId: probModel.problemId
            };
            const problemModelToUpdate = <IProblemModel>{
                ...problemToUpdate,
                _id: probModel._id,
                __v: probModel.__v
            };

            stubs.problemDB.find.resolves(probModel);
            stubs.problemDB.update.resolves(problemModelToUpdate);
            stubs.problemUtil.calculateProblemHash.returns(probModel.problemId);
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            await problemController.update(req, mockRes);

            sinon.assert.calledOnce(stubs.problemDB.update);
            sinon.assert.calledOnce(stubs.problemUtil.calculateProblemHash);
            sinon.assert.calledOnce(stubs.problemSetDB.updateProblemCount);
            sinon.assert.calledWith(
                stubs.problemUtil.calculateProblemHash,
                probModel.source,
                probModel.problemMetadata.platformProblemId
            );

            sinon.assert.calledWith(
                stubs.problemDB.update,
                req.params.problemId,
                problemToUpdate
            );
            sinon.assert.calledWith(
                stubs.problemSetDB.updateProblemCount,
                problemModelToUpdate
            );
            sinon.assert.calledWith(mockRes.status, statusCodes.SUCCESS);
            sinon.assert.calledWith(mockRes.json, problemModelToUpdate);
        });

        it("status 200: returns successfully an updated problem with a linked problem set", async () => {
            req.params.problemId = testProblemModel1._id;
            req.body = {
                ...testProblem1
            };
            req.body.title = "Updated title";
            const problemToUpdate: IProblem = {
                ...req.body,
                problemId: testProblemModel1.problemId
            };
            const problemModelToUpdate = <IProblemModel>{
                ...problemToUpdate,
                _id: testProblemModel1._id,
                __v: testProblemModel1.__v
            };

            stubs.problemDB.find.resolves(testProblemModel1);
            stubs.problemDB.update.resolves(problemModelToUpdate);
            stubs.problemUtil.calculateProblemHash.returns(
                testProblemModel1.problemId
            );
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            await problemController.update(req, mockRes);

            sinon.assert.calledOnce(stubs.problemDB.update);
            sinon.assert.calledOnce(stubs.problemUtil.calculateProblemHash);
            sinon.assert.calledOnce(stubs.problemSetDB.updateProblemCount);
            sinon.assert.calledWith(
                stubs.problemUtil.calculateProblemHash,
                testProblem1.source,
                testProblem1.problemMetadata.platformProblemId
            );

            sinon.assert.calledWith(
                stubs.problemDB.update,
                req.params.problemId,
                problemToUpdate
            );
            sinon.assert.calledWith(
                stubs.problemSetDB.updateProblemCount,
                problemModelToUpdate
            );
            sinon.assert.calledWith(mockRes.status, statusCodes.SUCCESS);
            sinon.assert.calledWith(mockRes.json, problemModelToUpdate);
        });

        it("status 200: returns successfully an updated problem when source link + platformProblemId is changed", async () => {
            req.params.problemId = testProblemModel1._id;
            req.body = {
                ...testProblem1
            };

            req.body.sourceLink = testProblemModel2.sourceLink;
            req.body.problemMetadata = {};
            req.body.problemMetadata.difficulty =
                testProblemModel2.problemMetadata.difficulty;
            req.body.problemMetadata.platformProblemId =
                testProblemModel2.problemMetadata.platformProblemId;

            const problemToUpdate: IProblem = {
                ...req.body,
                problemId: testProblemModel2.problemId
            };
            const problemModelToUpdate = <IProblemModel>{
                ...problemToUpdate,
                _id: testProblemModel1._id,
                __v: testProblemModel1.__v
            };

            stubs.problemDB.find.resolves(testProblemModel1);
            stubs.problemDB.update.resolves(problemModelToUpdate);
            stubs.problemUtil.calculateProblemHash.returns(
                testProblemModel2.problemId
            );
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            await problemController.update(req, mockRes);

            sinon.assert.calledOnce(stubs.problemDB.update);
            sinon.assert.calledOnce(stubs.problemUtil.calculateProblemHash);
            sinon.assert.calledOnce(stubs.problemSetDB.updateProblemCount);
            sinon.assert.calledWith(
                stubs.problemUtil.calculateProblemHash,
                req.body.source,
                req.body.problemMetadata.platformProblemId
            );

            sinon.assert.calledWith(
                stubs.problemDB.update,
                req.params.problemId,
                problemToUpdate
            );
            sinon.assert.calledWith(
                stubs.problemSetDB.updateProblemCount,
                problemModelToUpdate
            );
            sinon.assert.calledWith(mockRes.status, statusCodes.SUCCESS);
            sinon.assert.calledWith(mockRes.json, problemModelToUpdate);
        });

        it("status 404: returns an appropriate response if problem doesn't exist", async () => {
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            req.params.problemId = "nonexistantId";

            await problemController.update(req, mockRes);

            sinon.assert.calledOnce(stubs.problemDB.find);
            sinon.assert.notCalled(stubs.problemUtil.calculateProblemHash);
            sinon.assert.notCalled(stubs.problemDB.update);
            sinon.assert.notCalled(stubs.problemSetDB.updateProblemCount);

            sinon.assert.calledWith(stubs.problemDB.find, req.params.problemId);
            sinon.assert.calledWith(mockRes.status, statusCodes.NOT_FOUND);
            sinon.assert.calledWith(mockRes.json, {
                status: statusCodes.NOT_FOUND,
                message: "Problem not found"
            });
        });

        it("status 422: returns an appropriate response with validation error", async () => {
            const errorMsg = {
                status: statusCodes.MISSING_PARAMS,
                message: "body[title]: Invalid or missing 'title'"
            };
            stubs.validators.validationResult.returns(
                <any>validationErrorWithMessage(errorMsg)
            );
            await problemController.update(req, mockRes);
            sinon.assert.calledOnce(stubs.validators.validationResult);
            sinon.assert.notCalled(stubs.problemDB.find);
            sinon.assert.notCalled(stubs.problemDB.update);
            sinon.assert.calledWith(mockRes.status, statusCodes.MISSING_PARAMS);
            sinon.assert.calledWith(mockRes.json, errorMsg);
        });

        it("status 500: returns server error if server fails", async () => {
            stubs.problemDB.find.throws();
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );
            req.params.problemId = "someProblemId";

            await problemController.update(req, mockRes);
            sinon.assert.calledOnce(stubs.problemDB.find);
            sinon.assert.calledWith(stubs.problemDB.find, req.params.problemId);
            sinon.assert.calledWith(mockRes.status, statusCodes.SERVER_ERROR);
        });
    });

    describe("Delete", () => {
        let req;
        beforeEach(() => {
            req = mockReq({});
        });

        it("status 200: returns successfully upon deletion", async () => {
            stubs.problemDB.find.resolves(testProblemModel1);
            stubs.problemDB.delete.resolves(testProblemModel1);
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            req.params.problemId = testProblemModel1._id;

            await problemController.delete(req, mockRes);

            sinon.assert.calledOnce(stubs.problemDB.find);
            sinon.assert.calledOnce(stubs.problemDB.delete);
            sinon.assert.calledOnce(stubs.problemSetDB.updateProblemCount);

            sinon.assert.calledWith(
                stubs.problemDB.find,
                testProblemModel1._id
            );
            sinon.assert.calledWith(
                stubs.problemDB.delete,
                testProblemModel1._id
            );
            sinon.assert.calledWith(
                stubs.problemSetDB.updateProblemCount,
                testProblemModel1
            );
            sinon.assert.calledWith(mockRes.status, statusCodes.SUCCESS);
            sinon.assert.calledWith(mockRes.json);
        });

        it("status 404: returns an appropriate response if problem doesn't exist", async () => {
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );

            req.params.problemId = "nonexistantId";

            await problemController.delete(req, mockRes);

            sinon.assert.calledOnce(stubs.problemDB.find);
            sinon.assert.notCalled(stubs.problemDB.delete);
            sinon.assert.notCalled(stubs.problemSetDB.updateProblemCount);

            sinon.assert.calledWith(stubs.problemDB.find, req.params.problemId);
            sinon.assert.calledWith(mockRes.status, statusCodes.NOT_FOUND);
            sinon.assert.calledWith(mockRes.json, {
                status: statusCodes.NOT_FOUND,
                message: "Problem not found"
            });
        });

        it("status 422: returns an appropriate response with validation error", async () => {
            const errorMsg = {
                status: statusCodes.MISSING_PARAMS,
                message: "params[problemId]: Invalid or missing 'problemId'"
            };
            stubs.validators.validationResult.returns(
                <any>validationErrorWithMessage(errorMsg)
            );

            await problemController.delete(req, mockRes);
            sinon.assert.calledOnce(stubs.validators.validationResult);
            sinon.assert.notCalled(stubs.problemDB.find);
            sinon.assert.calledWith(mockRes.status, statusCodes.MISSING_PARAMS);
            sinon.assert.calledWith(mockRes.json, errorMsg);
        });

        it("status 500: returns server error if server fails", async () => {
            stubs.problemDB.find.throws();
            stubs.validators.validationResult.returns(
                <any>emptyValidationError()
            );
            req.params.problemId = testProblemModel1._id;

            await problemController.delete(req, mockRes);
            sinon.assert.calledOnce(stubs.problemDB.find);
            sinon.assert.calledWith(stubs.problemDB.find, req.params.problemId);
            sinon.assert.calledWith(mockRes.status, statusCodes.SERVER_ERROR);
        });
    });
});
