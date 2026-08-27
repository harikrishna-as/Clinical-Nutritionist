import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import SmoothScroll from './components/SmoothScroll'
import Home from './pages/Home'
import Departments from './pages/Departments'
import DepartmentDetail from './pages/DepartmentDetail'
import Medications from './pages/Medications'
import Assessment from './pages/Assessment'
import Reports from './pages/Reports'
import CameraPage from './pages/CameraPage'
import RecommendPage from './pages/RecommendPage'
import MLResultsPage from './pages/MLResultsPage'
import DatabasePage from './pages/DatabasePage'
import KnowledgeGraphPage from './pages/KnowledgeGraphPage'
import MedicineSearch from './pages/MedicineSearch'
import TrainedModels from './pages/TrainedModels'
import '@fontsource-variable/geist'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SmoothScroll>
        <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/departments/:slug" element={<DepartmentDetail />} />
          <Route path="/medications" element={<Medications />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/recommend" element={<RecommendPage />} />
          <Route path="/ml-results" element={<MLResultsPage />} />
          <Route path="/database" element={<DatabasePage />} />
          <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
          <Route path="/medicines-search" element={<MedicineSearch />} />
          <Route path="/trained-models" element={<TrainedModels />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
      </SmoothScroll>
    </BrowserRouter>
  </React.StrictMode>
)
