import { authSanitizer } from '../sanitization'

describe('Sanitization', () => {
  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello World'
      const result = authSanitizer.sanitizeString(input)
      expect(result).toBe('Hello World')
    })

    it('should remove HTML tags', () => {
      const input = '<div><p>Hello <strong>World</strong></p></div>'
      const result = authSanitizer.sanitizeString(input)
      expect(result).toBe('Hello World')
    })

    it('should decode HTML entities', () => {
      const input = '&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;'
      const result = authSanitizer.sanitizeString(input)
      expect(result).toBe('')
    })

    it('should handle SQL injection attempts', () => {
      const input = "'; DROP TABLE users; --"
      const result = authSanitizer.sanitizeString(input)
      expect(result).toBe("'; DROP TABLE users; --") // Should be escaped, not removed
    })

    it('should preserve normal text', () => {
      const input = 'This is normal text with numbers 123 and symbols @#$'
      const result = authSanitizer.sanitizeString(input)
      expect(result).toBe(input)
    })

    it('should handle empty string', () => {
      const result = authSanitizer.sanitizeString('')
      expect(result).toBe('')
    })

    it('should handle null and undefined', () => {
      expect(authSanitizer.sanitizeString(null as any)).toBe('')
      expect(authSanitizer.sanitizeString(undefined as any)).toBe('')
    })

    it('should remove javascript: URLs', () => {
      const input = 'javascript:alert("xss")'
      const result = authSanitizer.sanitizeString(input)
      expect(result).toBe('')
    })

    it('should remove data: URLs with javascript', () => {
      const input = 'data:text/html,<script>alert("xss")</script>'
      const result = authSanitizer.sanitizeString(input)
      expect(result).toBe('')
    })

    it('should handle multiple XSS patterns', () => {
      const input = '<img src="x" onerror="alert(1)"><script>alert(2)</script>onclick="alert(3)"'
      const result = authSanitizer.sanitizeString(input)
      expect(result).not.toContain('alert')
      expect(result).not.toContain('script')
      expect(result).not.toContain('onerror')
    })
  })

  describe('sanitizeEmail', () => {
    it('should trim and lowercase email', () => {
      const input = '  TEST@EXAMPLE.COM  '
      const result = authSanitizer.sanitizeEmail(input)
      expect(result).toBe('test@example.com')
    })

    it('should remove HTML from email', () => {
      const input = '<script>alert("xss")</script>test@example.com'
      const result = authSanitizer.sanitizeEmail(input)
      expect(result).toBe('test@example.com')
    })

    it('should handle valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.org',
        'user123@test-domain.co.uk'
      ]

      validEmails.forEach(email => {
        const result = authSanitizer.sanitizeEmail(email)
        expect(result).toBe(email.toLowerCase())
      })
    })

    it('should handle empty email', () => {
      expect(authSanitizer.sanitizeEmail('')).toBe('')
      expect(authSanitizer.sanitizeEmail(null as any)).toBe('')
      expect(authSanitizer.sanitizeEmail(undefined as any)).toBe('')
    })

    it('should remove dangerous characters', () => {
      const input = 'test@example.com<script>alert("xss")</script>'
      const result = authSanitizer.sanitizeEmail(input)
      expect(result).toBe('test@example.com')
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize all string properties', () => {
      const input = {
        name: '<script>alert("xss")</script>John Doe',
        email: '  TEST@EXAMPLE.COM  ',
        age: 25,
        active: true
      }

      const result = authSanitizer.sanitizeObject(input)

      expect(result).toEqual({
        name: 'John Doe',
        email: 'test@example.com',
        age: 25,
        active: true
      })
    })

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<b>John</b>',
          profile: {
            bio: '<script>alert("hack")</script>Developer'
          }
        },
        count: 5
      }

      const result = authSanitizer.sanitizeObject(input)

      expect(result).toEqual({
        user: {
          name: 'John',
          profile: {
            bio: 'Developer'
          }
        },
        count: 5
      })
    })

    it('should handle arrays', () => {
      const input = {
        tags: ['<script>tag1</script>', 'tag2', '<b>tag3</b>'],
        metadata: {
          keywords: ['<script>keyword1</script>', 'keyword2']
        }
      }

      const result = authSanitizer.sanitizeObject(input)

      expect(result).toEqual({
        tags: ['', 'tag2', 'tag3'],
        metadata: {
          keywords: ['', 'keyword2']
        }
      })
    })

    it('should preserve non-string types', () => {
      const input = {
        string: '<script>test</script>',
        number: 42,
        boolean: true,
        date: new Date('2023-01-01'),
        nullValue: null,
        undefinedValue: undefined,
        array: [1, 2, 3]
      }

      const result = authSanitizer.sanitizeObject(input)

      expect(result.string).toBe('')
      expect(result.number).toBe(42)
      expect(result.boolean).toBe(true)
      expect(result.date).toEqual(new Date('2023-01-01'))
      expect(result.nullValue).toBe(null)
      expect(result.undefinedValue).toBe(undefined)
      expect(result.array).toEqual([1, 2, 3])
    })

    it('should handle empty and null objects', () => {
      expect(authSanitizer.sanitizeObject({})).toEqual({})
      expect(authSanitizer.sanitizeObject(null as any)).toEqual({})
      expect(authSanitizer.sanitizeObject(undefined as any)).toEqual({})
    })
  })

  describe('isValidInput', () => {
    it('should accept clean input', () => {
      const input = 'This is clean input'
      expect(authSanitizer.isValidInput(input)).toBe(true)
    })

    it('should reject script tags', () => {
      const input = '<script>alert("xss")</script>'
      expect(authSanitizer.isValidInput(input)).toBe(false)
    })

    it('should reject javascript: URLs', () => {
      const input = 'javascript:alert(1)'
      expect(authSanitizer.isValidInput(input)).toBe(false)
    })

    it('should reject event handlers', () => {
      const inputs = [
        'onclick="alert(1)"',
        'onload="maliciousCode()"',
        'onerror="hack()"'
      ]

      inputs.forEach(input => {
        expect(authSanitizer.isValidInput(input)).toBe(false)
      })
    })

    it('should accept normal text with special characters', () => {
      const input = 'Email: user@example.com, Phone: +1-234-567-8900'
      expect(authSanitizer.isValidInput(input)).toBe(true)
    })

    it('should handle empty input', () => {
      expect(authSanitizer.isValidInput('')).toBe(true)
      expect(authSanitizer.isValidInput(null as any)).toBe(true)
      expect(authSanitizer.isValidInput(undefined as any)).toBe(true)
    })
  })

  describe('sanitizeFileName', () => {
    it('should remove dangerous file paths', () => {
      const input = '../../../etc/passwd'
      const result = authSanitizer.sanitizeFileName(input)
      expect(result).toBe('etc/passwd')
    })

    it('should remove null bytes', () => {
      const input = 'file\x00.txt'
      const result = authSanitizer.sanitizeFileName(input)
      expect(result).toBe('file.txt')
    })

    it('should handle Windows-style paths', () => {
      const input = '..\\..\\windows\\system32\\config'
      const result = authSanitizer.sanitizeFileName(input)
      expect(result).toBe('windows/system32/config')
    })

    it('should preserve valid filenames', () => {
      const validNames = [
        'document.pdf',
        'image_2023-01-01.jpg',
        'data-file.csv',
        'my-file (1).txt'
      ]

      validNames.forEach(name => {
        const result = authSanitizer.sanitizeFileName(name)
        expect(result).toBe(name)
      })
    })

    it('should handle empty filename', () => {
      expect(authSanitizer.sanitizeFileName('')).toBe('')
      expect(authSanitizer.sanitizeFileName(null as any)).toBe('')
    })
  })
})