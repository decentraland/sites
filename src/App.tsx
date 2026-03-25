import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RemoteLoader } from './components/RemoteLoader'
import { IndexPage } from './pages/index.tsx'
import { SignInRedirect } from './pages/SignInRedirect'

const App = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/sign-in" element={<SignInRedirect />} />
          <Route path="/whats-on/*" element={<RemoteLoader name="whats-on" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export { App }
