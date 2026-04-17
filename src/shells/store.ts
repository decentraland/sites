import { configureStore } from '@reduxjs/toolkit'

// PR2/PR3 will add real reducers (explore events, blog, cmsClient, algoliaClient)
// and export typed hooks (useAppDispatch/useAppSelector) when they have consumers.
const store = configureStore({
  reducer: {},
  devTools: import.meta.env.DEV
})

export { store }
