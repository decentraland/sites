import { configureStore } from '@reduxjs/toolkit'
import { eventsClient } from '../features/explore-events/events.client'

// PR3 will add blog, cmsClient, algoliaClient reducers and redux-persist.
// Typed hooks (useAppDispatch/useAppSelector) are not exported yet — explore
// code consumes RTK Query auto-generated hooks which dispatch internally.
const store = configureStore({
  reducer: {
    [eventsClient.reducerPath]: eventsClient.reducer
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(eventsClient.middleware),
  devTools: import.meta.env.DEV
})

export { store }
