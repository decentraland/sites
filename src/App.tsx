import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CreatePage } from './pages/create'
import { DownloadPage } from './pages/download'
import { DownloadSuccessPage } from './pages/download_success'
import { IndexPage } from './pages/index.tsx'
import { SignInRedirect } from './pages/SignInRedirect'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/sign-in" element={<SignInRedirect />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/download_success" element={<DownloadSuccessPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export { App }
