import { memo } from 'react'
import type { ChangeEvent, FC } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ClearIcon from '@mui/icons-material/Clear'
// eslint-disable-next-line @typescript-eslint/naming-convention
import SearchIcon from '@mui/icons-material/Search'
import { IconButton, InputAdornment, TextField } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { SearchFieldRoot } from './SearchField.styled'

interface SearchFieldProps {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  placeholder: string
  ariaLabel?: string
}

const SearchFieldComponent: FC<SearchFieldProps> = ({ value, onChange, onClear, placeholder, ariaLabel }) => {
  const t = useFormatMessage()

  return (
    <SearchFieldRoot>
      <TextField
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        size="small"
        fullWidth
        // eslint-disable-next-line @typescript-eslint/naming-convention
        inputProps={{ 'aria-label': ariaLabel ?? placeholder }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={onClear} aria-label={t('component.storage.select_page.clear_search')} edge="end">
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null
        }}
      />
    </SearchFieldRoot>
  )
}

const SearchField = memo(SearchFieldComponent)
SearchField.displayName = 'SearchField'

export { SearchField }
export type { SearchFieldProps }
