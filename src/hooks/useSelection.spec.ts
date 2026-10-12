import { act, renderHook } from '@testing-library/react'
import type { RenderHookResult } from '@testing-library/react'
// eslint-disable-next-line import/no-unresolved
import { useSelection } from './useSelection'

type Props = { ids: ReadonlyArray<string> }
type Hook = RenderHookResult<ReturnType<typeof useSelection>, Props>

describe('useSelection', () => {
  let hook: Hook

  beforeEach(() => {
    hook = renderHook(({ ids }: Props) => useSelection(ids), { initialProps: { ids: ['a', 'b', 'c'] } })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when nothing has been selected', () => {
    it('should report an empty, non-all selection with a zero count', () => {
      const { selected, allSelected, count } = hook.result.current
      expect({ selected: [...selected], allSelected, count }).toEqual({ selected: [], allSelected: false, count: 0 })
    })
  })

  describe('when a row is toggled', () => {
    beforeEach(() => {
      act(() => hook.result.current.toggle('a'))
    })

    it('should select only that row and count it', () => {
      const { selected, count } = hook.result.current
      expect({ selected: [...selected], count }).toEqual({ selected: ['a'], count: 1 })
    })

    describe('and it is toggled again', () => {
      beforeEach(() => {
        act(() => hook.result.current.toggle('a'))
      })

      it('should leave the selection empty', () => {
        expect([...hook.result.current.selected]).toEqual([])
      })
    })
  })

  describe('when every loaded row is toggled one by one', () => {
    beforeEach(() => {
      act(() => hook.result.current.toggle('a'))
      act(() => hook.result.current.toggle('b'))
      act(() => hook.result.current.toggle('c'))
    })

    it('should keep the selection partial rather than all', () => {
      expect(hook.result.current.allSelected).toBe(false)
    })

    describe('and the header checkbox is toggled', () => {
      beforeEach(() => {
        act(() => hook.result.current.toggleAll())
      })

      it('should clear the selection without entering all mode', () => {
        const { selected, allSelected } = hook.result.current
        expect({ selected: [...selected], allSelected }).toEqual({ selected: [], allSelected: false })
      })
    })
  })

  describe('when the header checkbox is toggled', () => {
    beforeEach(() => {
      act(() => hook.result.current.toggleAll())
    })

    it('should enter all mode and show every loaded row as selected', () => {
      const { allSelected, isSelected } = hook.result.current
      expect({ allSelected, b: isSelected('b') }).toEqual({ allSelected: true, b: true })
    })

    describe('and it is toggled again', () => {
      beforeEach(() => {
        act(() => hook.result.current.toggleAll())
      })

      it('should clear the selection', () => {
        const { selected, allSelected } = hook.result.current
        expect({ selected: [...selected], allSelected }).toEqual({ selected: [], allSelected: false })
      })
    })

    describe('and one row is unchecked', () => {
      beforeEach(() => {
        act(() => hook.result.current.toggle('b'))
      })

      it('should leave all mode and keep every other loaded row selected', () => {
        const { selected, allSelected } = hook.result.current
        expect({ selected: [...selected].sort(), allSelected }).toEqual({ selected: ['a', 'c'], allSelected: false })
      })
    })

    describe('and the visible rows are toggled', () => {
      beforeEach(() => {
        act(() => hook.result.current.toggleVisible(['a', 'b']))
      })

      it('should leave all mode and unselect only the visible rows', () => {
        const { selected, allSelected } = hook.result.current
        expect({ selected: [...selected], allSelected }).toEqual({ selected: ['c'], allSelected: false })
      })
    })
  })

  describe('when the visible rows are toggled', () => {
    beforeEach(() => {
      act(() => hook.result.current.toggleVisible(['a', 'b']))
    })

    it('should select the visible rows as a partial selection', () => {
      const { selected, allSelected } = hook.result.current
      expect({ selected: [...selected].sort(), allSelected }).toEqual({ selected: ['a', 'b'], allSelected: false })
    })

    describe('and they are toggled again while all of them are selected', () => {
      beforeEach(() => {
        act(() => hook.result.current.toggleVisible(['a', 'b']))
      })

      it('should remove both rows', () => {
        expect([...hook.result.current.selected]).toEqual([])
      })
    })
  })

  describe('when a selected row disappears from the loaded ids', () => {
    beforeEach(() => {
      act(() => hook.result.current.toggle('a'))
      act(() => hook.result.current.toggle('b'))
      hook.rerender({ ids: ['a'] })
    })

    it('should drop the missing row from the selection', () => {
      const { selected, count } = hook.result.current
      expect({ selected: [...selected], count }).toEqual({ selected: ['a'], count: 1 })
    })
  })

  describe('when the selection is cleared', () => {
    beforeEach(() => {
      act(() => hook.result.current.toggleAll())
      act(() => hook.result.current.clear())
    })

    it('should empty the selection and leave all mode', () => {
      const { selected, allSelected } = hook.result.current
      expect({ selected: [...selected], allSelected }).toEqual({ selected: [], allSelected: false })
    })
  })

  describe('when the hook re-renders with a new ids array', () => {
    let toggle: ReturnType<typeof useSelection>['toggle']

    beforeEach(() => {
      toggle = hook.result.current.toggle
      hook.rerender({ ids: ['a', 'b', 'c'] })
    })

    it('should keep toggle referentially stable', () => {
      expect(hook.result.current.toggle).toBe(toggle)
    })
  })
})
