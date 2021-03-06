import { IProblem } from "../../interfaces/IProblem";
import { Problem, IProblemModel } from "../models/problem";
import { hash } from "../../util/hash";

export const problemDBInteractions = {
    create: (problem: IProblem): Promise<IProblemModel> => {
        return Problem.create(problem);
    },

    all: (): Promise<IProblemModel[]> => {
        return Problem.find().sort({ createdAt: -1 }).exec();
    },

    find: (problemId: string): Promise<IProblemModel> => {
        return Problem.findOne({ _id: problemId }).exec();
    },

    countInProblemSet: (problemSetId: string): Promise<number> => {
        return Problem.countDocuments({ problemSetIds: problemSetId }).exec();
    },

    listByProblemSet: (problemSetIds: string): Promise<IProblemModel[]> => {
        return Problem.find({ problemSetIds: problemSetIds }).exec();
    },

    findByProblemNumberAndPlatform: (
        problemNumber: string,
        platform: string
    ): Promise<IProblemModel> => {
        const problemHash = hash.calculateProblemHash(problemNumber, platform);
        return Problem.findOne({ problemId: problemHash }).exec();
    },

    findByGeneratedId: (generatedProblemId: string): Promise<IProblemModel> => {
        return Problem.findOne({ problemId: generatedProblemId }).exec();
    },

    update: (
        problemId: string,
        newProblem: IProblem
    ): Promise<IProblemModel> => {
        return Problem.findByIdAndUpdate(problemId, newProblem, {
            new: true
        }).exec();
    },

    removeProblemSetId: (problemSetId: string): Promise<void> => {
        return Problem.update(
            { problemSetIds: problemSetId },
            {
                $pull: { problemSetIds: { $in: [problemSetId] } }
            },
            { multi: true }
        ).exec();
    },

    delete: (problemId: string): Promise<IProblemModel> => {
        return Problem.findByIdAndDelete(problemId).exec();
    }
};
