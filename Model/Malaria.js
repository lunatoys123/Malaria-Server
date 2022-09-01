import mongoose from "mongoose";

var connection = mongoose.createConnection(
  "mongodb+srv://lunatoys:lunatoys@cluster0.efyxi.mongodb.net/Malaria?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const DoctorSchema = new mongoose.Schema({
  Login_name: String,
  Role: String,
  Hospital_id: mongoose.SchemaTypes.ObjectId,
  Password: String,
  Phone_number: String,
  createBy: String,
  Account_status: String,
  Email: String,
});

var DoctorModel = connection.model("Doctor", DoctorSchema, "Doctor");

const HosptialSchema = new mongoose.Schema({
  name: String,
  Location: {
    City: String,
    Country: String,
    Street: String,
    Apartment: String,
  },
  Phone_number: String,
  Region: String,
  createBy: String,
});

var HospitalModel = connection.model("Hosptial", HosptialSchema, "Hospital");

const MessageSchema = new mongoose.Schema({
  Doctor_id: mongoose.SchemaTypes.ObjectId,
  Message_title: String,
  Message_Content: String,
  status: String,
  dtCreated: Date,
  createBy: String,
});

var MessageModel = connection.model("Message", MessageSchema, "Message");

const countryCodeSchema = new mongoose.Schema({
  code: String,
  country_name: String,
});

var countryCodeModel = connection.model(
  "Country_code",
  countryCodeSchema,
  "Country_code"
);

const WHOSchema = new mongoose.Schema({
  Indication_code: String,
  country_code: String,
  data: [
    {
      Year: String,
      Low: Number,
      value: Number,
      High: Number,
    },
  ],
});

var WHOModel = connection.model("WHO_DATA", WHOSchema, "WHO_DATA");

const PatientSchema = new mongoose.Schema({
  name: String,
  Identification: String,
  Contact: [
    {
      Type: String,
      Phone_number: String,
    },
  ],
  Location: {
    City: String,
    Country: String,
    Street: String,
    Apartment: String,
  },
  Age: Number,
  Date_of_Birth: String,
  Pregnant: Boolean,
  Email: String,
  Gender: String,
  CreateBy: String,
  dtCreatedBy: Date,
  UpdateBy: String,
  dtUpdatedBy: Date,
});

var PatientModel = connection.model("Patient", PatientSchema, "Patient");

const TreatmentSchema = new mongoose.Schema({
  case_id: mongoose.SchemaTypes.ObjectId,
  Threapy: String,
  Received: String,
  Chemoprophylaxis_taken: String,
  Drug_taken: String,
  pills_taken: String,
  missed_dose_reason: String,
  Side_Effect: String,
  dtCreated: Date,
  dtUpdated: Date,
});

var TreatmentModel = connection.model(
  "Treatment",
  TreatmentSchema,
  "Treatment"
);

const LabortorySchema = new mongoose.Schema({
  case_id: mongoose.SchemaTypes.ObjectId,
  Blood_Smear: {
    status: String,
    Description: String,
    Collection_Date: Date,
    Laboratory_name: String,
    Phone_Number: String,
  },
  PCR_of_Blood: {
    status: String,
    Description: String,
    Collection_Date: Date,
    Laboratory_name: String,
    Phone_Number: String,
  },
  RDT: {
    status: String,
    Description: String,
    Collection_Date: Date,
    Laboratory_name: String,
    Phone_Number: String,
  },
  dtCreated: Date,
  dtUpdated: Date,
});

var LabortaryModel = connection.model(
  "Laboratory",
  LabortorySchema,
  "Laboratory"
);

const caseSchema = new mongoose.Schema({
  Patient_id: mongoose.SchemaTypes.ObjectId,
  Doctor_id: mongoose.SchemaTypes.ObjectId,
  Discharge_Date: Date,
  Admit_Date: Date,
  Symptoms: [
    {
      Signs: String,
      Symptomatic: String,
      Remark: String,
    },
  ],
  Clinical_Complication: [
    {
      Complication: String,
      Description: String,
    },
  ],
  Diagnosis: String,
  Hospitalized: Boolean,
  Emergency: Boolean,
  blood_transfusion: Boolean,
  Patient_Status: {
    status: String,
    Status_Date: Date,
  },
  Disease_case: String,
  Travel_hisotry: {
    destination: String,
    start_date: Date,
    end_Date: Date,
    Remark: String,
  },
  dtCreated: Date,
  dtupdated: Date,
});

var caseModel = connection.model("Case", caseSchema, "Case");

export default {
  Doctor: DoctorModel,
  Hospital: HospitalModel,
  Message: MessageModel,
  Country_code: countryCodeModel,
  WHO: WHOModel,
  Patient: PatientModel,
  Treatment: TreatmentModel,
  Labortary: LabortaryModel,
  case: caseModel,
};
