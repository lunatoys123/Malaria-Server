import mongoose from 'mongoose'
import Malaria from '../Model/Malaria.js'

const Case = Malaria.case;

export const getPatientList = async (req, res) => {

    const Doctor_id = req.query.Doctor_id;

    var PatientObject = await Case.aggregate([
        {
            $match: {
                Doctor_id: mongoose.Types.ObjectId(Doctor_id)
            }
        },
        {
            $lookup: {
                from: "Patient",
                localField: "Patient_id",
                foreignField: "_id",
                as: "Patient"
            }
        },
        {
            $project: {
                Patient: 1
            }
        },
        {
            $unwind: {
                path: "$Patient"
            }
        }, 
        {
            $project: {
                _id:0,
                Name: "$Patient.Name",
                Phone: "$Patient.Phone",
                Age: "$Patient.Age",
                Email: "$Patient.Email"
            }
        }
    ])

    console.log(PatientObject)

    return res.status(200).send({data: PatientObject})

}
