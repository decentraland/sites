import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { IndexPage } from './pages/index.tsx'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export { App }
