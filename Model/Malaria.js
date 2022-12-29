import mongoose from "mongoose";

var connection = mongoose.createConnection(
  "mongodb+srv://lunatoys:lunatoys@cluster0.efyxi.mongodb.net/Malaria?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("Malaria Database Connected");
  },
  (err) => {
    console.log(err);
  }
);

const DoctorSchema = new mongoose.Schema({
  Login_name: { type: String, required: true },
  Role: String,
  Hospital_id: { type: mongoose.SchemaTypes.ObjectId, required: true },
  Password: { type: String, required: true },
  Phone_number: { type: String, required: true },
  createBy: String,
  Account_status: String,
  Email: { type: String, required: true },
});

var DoctorModel = connection.model("Doctor", DoctorSchema, "Doctor");

const HosptialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  Location: {
    City: { type: String, required: true },
    Country: { type: String, required: true },
    Street: { type: String, required: true },
    Apartment: { type: String, required: true },
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

const countryCodeSchema = new mongoose.Schema(
  {
    code: String,
    country_name: String,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

countryCodeSchema.virtual("Options").get(function () {
  return `${this.code} (${this.country_name})`;
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
  Name: { type: String, required: true },
  Id: { type: String, required: true },
  Phone: String,
  Home: {
    Location: String,
    Telphone: String,
    Contact_Person: String,
    Contact_Person_Tel: String,
  },
  Work: {
    Location: String,
    Telphone: String,
    Contact_Person: String,
    Contact_Person_Tel: String,
  },
  Age: Number,
  Date_of_Birth: String,
  Pregnant: Boolean,
  PregnantDate: Date,
  Email: String,
  Gender: { type: String, required: true },
  CreateBy: String,
  dtCreated: { type: Date, default: Date.now() },
  UpdateBy: String,
  dtUpdated: { type: Date, default: Date.now() },
});

var PatientModel = connection.model("Patient", PatientSchema, "Patient");

const TreatmentSchema = new mongoose.Schema({
  case_id: mongoose.SchemaTypes.ObjectId,
  Therapy: String,
  Received: String,
  Chemoprophylaxis_taken: String,
  Drug_taken: String,
  Drug_taken_Other: String,
  pills_taken: String,
  pills_taken_Other: String,
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
    Type: String,
    Type_Other: String,
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
  // Discharge_Date: Date,
  // Admit_Date: Date,
  Symptoms: {
    Sign: [],
    Symptomatic: String,
    Remark: String,
    Onset_date: Date,
  },
  Clinical_Complications: {
    Complications: [],
    Description: String,
  },
  Hospitalization: [
    {
      Hospital: String,
      Admit_Date: Date,
      City: String,
      DisCharge_Date: Date,
      Discharge_Diagnosis: String,
      Street_Address: String,
      Zip_Code: String,
    },
  ],
  Previous_Diagnosis_Malaria: {},
  Diagnosis: String,
  // Hospitalized: Boolean,
  // Emergency: Boolean,
  // blood_transfusion: Boolean,
  Patient_Status: String,
  Status_date: Date,
  Report_Status: String,
  // Disease_case: String,
  Travel_History: [
    {
      Location: String,
      Date_Start: Date,
      Date_End: Date,
    },
  ],
  dtCreated: { type: Date, default: Date.now() },
  dtupdated: { type: Date, default: Date.now() },
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
