import { Document, Model, model, Schema } from "mongoose";
import { IProblem } from "../../interfaces/IProblem";

export interface IProblemModel extends IProblem, Document {}

const problemSchema: Schema = new Schema(
    {
        title: String,
        source: {
            type: String,
            enum: ["CODEFORCES", "OTHER"]
        },
        problemId: {
            type: String,
            index: true
        },
        sourceLink: String,
        problemSetIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "Problem"
            }
        ],
        problemMetadata: {
            platformProblemId: String,
            difficulty: {
                type: String,
                enum: ["easy", "medium", "hard"]
            }
        }
    },
    {
        timestamps: true
    }
);

problemSchema.index({
    createdAt: 1
});

const Problem: Model<IProblemModel> = model("Problem", problemSchema);

export { Problem };
