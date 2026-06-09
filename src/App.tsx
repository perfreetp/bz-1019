import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import PatientOverview from "@/pages/PatientOverview";
import ExaminationRecord from "@/pages/ExaminationRecord";
import ImageAnnotation from "@/pages/ImageAnnotation";
import LesionAssessment from "@/pages/LesionAssessment";
import LesionArchive from "@/pages/LesionArchive";
import ReportEditor from "@/pages/ReportEditor";
import FollowupReminder from "@/pages/FollowupReminder";
import QualityDashboard from "@/pages/QualityDashboard";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<PatientOverview />} />
          <Route path="/examination/:id" element={<ExaminationRecord />} />
          <Route path="/annotation/:id" element={<ImageAnnotation />} />
          <Route path="/lesion/:id" element={<LesionAssessment />} />
          <Route path="/archive" element={<LesionArchive />} />
          <Route path="/report/:id" element={<ReportEditor />} />
          <Route path="/followup" element={<FollowupReminder />} />
          <Route path="/quality" element={<QualityDashboard />} />
          <Route path="*" element={<PatientOverview />} />
        </Routes>
      </Layout>
    </Router>
  );
}
