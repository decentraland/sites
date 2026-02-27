import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CreatePage } from './pages/create'
import { IndexPage } from './pages/index.tsx'
import { SignInRedirect } from './pages/SignInRedirect'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/sign-in" element={<SignInRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

export { App }
