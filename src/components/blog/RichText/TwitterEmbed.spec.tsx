import { render, screen, waitFor } from '@testing-library/react'
import { TwitterEmbed } from './TwitterEmbed'

describe('when rendering TwitterEmbed', () => {
  let originalTwttr: unknown
  let createTweet: jest.Mock

  beforeEach(() => {
    originalTwttr = (window as unknown as { twttr?: unknown }).twttr
    createTweet = jest.fn().mockResolvedValue(document.createElement('blockquote'))
    ;(window as unknown as { twttr: { widgets: { createTweet: jest.Mock } } }).twttr = {
      widgets: { createTweet }
    }
  })

  afterEach(() => {
    ;(window as unknown as { twttr?: unknown }).twttr = originalTwttr
    jest.resetAllMocks()
  })

  describe('and the widget script is already present', () => {
    it('should render the loading placeholder before the tweet resolves', () => {
      render(<TwitterEmbed tweetId="1234" />)
      expect(screen.getByText(/loading tweet/i)).toBeInTheDocument()
    })

    it('should call createTweet with the tweet id and default theme', async () => {
      render(<TwitterEmbed tweetId="1234" />)
      await waitFor(() => expect(createTweet).toHaveBeenCalledTimes(1))
      expect(createTweet.mock.calls[0][0]).toBe('1234')
      expect(createTweet.mock.calls[0][2]).toEqual({ theme: 'dark' })
    })

    it('should clear the loading placeholder once the tweet resolves', async () => {
      render(<TwitterEmbed tweetId="1234" />)
      await waitFor(() => expect(screen.queryByText(/loading tweet/i)).not.toBeInTheDocument())
    })

    describe('and a theme override is provided', () => {
      it('should pass the override to createTweet', async () => {
        render(<TwitterEmbed tweetId="9999" theme="light" />)
        await waitFor(() => expect(createTweet).toHaveBeenCalled())
        expect(createTweet.mock.calls[0][2]).toEqual({ theme: 'light' })
      })
    })
  })
})
