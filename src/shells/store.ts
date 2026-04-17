import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import { combineReducers, configureStore } from '@reduxjs/toolkit'

// Placeholder root reducer — PR2/PR3 will add explore and blog reducers.
const rootReducer = combineReducers({
  placeholder: (state: null = null) => state
})

const store = configureStore({
  reducer: rootReducer,
  devTools: import.meta.env.DEV
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

const useAppDispatch = () => useDispatch<AppDispatch>()
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export { store, useAppDispatch, useAppSelector }
export type { RootState, AppDispatch }
