import { QueryBuilder } from '../src/query-builder'
import { ValidationError } from '../src/validation'

describe('Advanced Query Builder Features', () => {
  let builder: QueryBuilder

  beforeEach(() => {
    builder = new QueryBuilder()
  })

  describe('Fuzzy Queries', () => {
    it('should create basic fuzzy query', () => {
      const result = builder.fuzzy('title', 'javascript').build()

      expect(result.query?.bool?.must).toContainEqual({
        fuzzy: {
          title: { value: 'javascript' },
        },
      })
    })

    it('should create fuzzy query with options', () => {
      const result = builder
        .fuzzy('title', 'javascript', {
          fuzziness: 'AUTO',
          boost: 1.5,
        })
        .build()

      expect(result.query?.bool?.must).toContainEqual({
        fuzzy: {
          title: {
            value: 'javascript',
            fuzziness: 'AUTO',
            boost: 1.5,
          },
        },
      })
    })

    it('should validate field name in fuzzy query', () => {
      expect(() => builder.fuzzy('', 'test')).toThrow(ValidationError)
    })
  })

  describe('Regular Expression Queries', () => {
    it('should create regexp query', () => {
      const result = builder.regexp('title', 'jav.*').build()

      expect(result.query?.bool?.must).toContainEqual({
        regexp: {
          title: { value: 'jav.*' },
        },
      })
    })

    it('should create regexp query with flags', () => {
      const result = builder.regexp('title', 'jav.*', 'ALL').build()

      expect(result.query?.bool?.must).toContainEqual({
        regexp: {
          title: {
            value: 'jav.*',
            flags: 'ALL',
          },
        },
      })
    })
  })

  describe('Query String Queries', () => {
    it('should create query_string query', () => {
      const result = builder.queryString('javascript AND tutorial').build()

      expect(result.query?.bool?.must).toContainEqual({
        query_string: {
          query: 'javascript AND tutorial',
        },
      })
    })

    it('should create query_string with options', () => {
      const result = builder
        .queryString('javascript tutorial', {
          fields: ['title', 'content'],
          default_operator: 'AND',
        })
        .build()

      expect(result.query?.bool?.must).toContainEqual({
        query_string: {
          query: 'javascript tutorial',
          fields: ['title', 'content'],
          default_operator: 'AND',
        },
      })
    })
  })

  describe('Simple Query String', () => {
    it('should create simple_query_string query', () => {
      const result = builder.simpleQueryString('javascript +tutorial').build()

      expect(result.query?.bool?.must).toContainEqual({
        simple_query_string: {
          query: 'javascript +tutorial',
        },
      })
    })

    it('should create simple_query_string with fields', () => {
      const result = builder
        .simpleQueryString('test', ['title', 'content'])
        .build()

      expect(result.query?.bool?.must).toContainEqual({
        simple_query_string: {
          query: 'test',
          fields: ['title', 'content'],
        },
      })
    })
  })

  describe('Nested Queries', () => {
    it('should create nested query', () => {
      const result = builder
        .nested('comments', (q) => {
          q.match('comments.message', 'great')
        })
        .build()

      expect(result.query?.bool?.must).toContainEqual({
        nested: {
          path: 'comments',
          query: {
            bool: {
              must: [
                {
                  match: {
                    'comments.message': { query: 'great' },
                  },
                },
              ],
            },
          },
        },
      })
    })
  })

  describe('Parent/Child Queries', () => {
    it('should create has_child query', () => {
      const result = builder
        .hasChild('comment', (q) => {
          q.match('message', 'excellent')
        })
        .build()

      expect(result.query?.bool?.must).toContainEqual({
        has_child: {
          type: 'comment',
          query: {
            bool: {
              must: [
                {
                  match: {
                    message: { query: 'excellent' },
                  },
                },
              ],
            },
          },
        },
      })
    })

    it('should create has_parent query', () => {
      const result = builder
        .hasParent('article', (q) => {
          q.term('category', 'tech')
        })
        .build()

      expect(result.query?.bool?.must).toContainEqual({
        has_parent: {
          parent_type: 'article',
          query: {
            bool: {
              filter: [
                {
                  term: {
                    'category.keyword': 'tech',
                  },
                },
              ],
            },
          },
        },
      })
    })
  })

  describe('Geo Queries', () => {
    it('should create geo_distance query', () => {
      const result = builder
        .geoDistance('location', '10km', 40.7128, -74.006)
        .build()

      expect(result.query?.bool?.filter).toContainEqual({
        geo_distance: {
          distance: '10km',
          location: { lat: 40.7128, lon: -74.006 },
        },
      })
    })

    it('should create geo_bounding_box query', () => {
      const result = builder
        .geoBoundingBox(
          'location',
          [40.8, -74.1], // top-left
          [40.7, -73.9] // bottom-right
        )
        .build()

      expect(result.query?.bool?.filter).toContainEqual({
        geo_bounding_box: {
          location: {
            top_left: { lat: 40.8, lon: -74.1 },
            bottom_right: { lat: 40.7, lon: -73.9 },
          },
        },
      })
    })

    it('should create geo_polygon query', () => {
      const points: Array<[number, number]> = [
        [40.8, -74.1],
        [40.8, -73.9],
        [40.7, -73.9],
      ]

      const result = builder.geoPolygon('location', points).build()

      expect(result.query?.bool?.filter).toContainEqual({
        geo_polygon: {
          location: {
            points: [
              { lat: 40.8, lon: -74.1 },
              { lat: 40.8, lon: -73.9 },
              { lat: 40.7, lon: -73.9 },
            ],
          },
        },
      })
    })

    it('should validate geo_polygon requires at least 3 points', () => {
      expect(() => {
        builder.geoPolygon('location', [
          [40.7, -74.0],
          [40.8, -74.1],
        ])
      }).toThrow('geo_polygon query requires at least 3 points')
    })
  })

  describe('Script Queries', () => {
    it('should create script query', () => {
      const result = builder.script("doc['price'].value > 100").build()

      expect(result.query?.bool?.must).toContainEqual({
        script: {
          script: {
            source: "doc['price'].value > 100",
          },
        },
      })
    })

    it('should create script query with params', () => {
      const result = builder
        .script("doc['price'].value > params.min_price", { min_price: 100 })
        .build()

      expect(result.query?.bool?.must).toContainEqual({
        script: {
          script: {
            source: "doc['price'].value > params.min_price",
            params: { min_price: 100 },
          },
        },
      })
    })
  })

  describe('More Like This Queries', () => {
    it('should create more_like_this with texts', () => {
      const result = builder
        .moreLikeThis(
          ['title', 'content'],
          ['javascript tutorial', 'react guide']
        )
        .build()

      expect(result.query?.bool?.must).toContainEqual({
        more_like_this: {
          fields: ['title', 'content'],
          like: ['javascript tutorial', 'react guide'],
        },
      })
    })

    it('should create more_like_this with documents', () => {
      const result = builder
        .moreLikeThis(['title', 'content'], undefined, [
          { _index: 'articles', _id: '1' },
        ])
        .build()

      expect(result.query?.bool?.must).toContainEqual({
        more_like_this: {
          fields: ['title', 'content'],
          like: [{ _index: 'articles', _id: '1' }],
        },
      })
    })
  })

  describe('Function Score', () => {
    it('should apply function_score', () => {
      const functions = [
        { weight: 1.5, filter: { term: { category: 'featured' } } },
      ]

      const result = builder
        .match('title', 'test')
        .functionScore(functions)
        .build()

      expect(result.query).toHaveProperty('function_score')
      expect(result.query?.function_score.functions).toEqual(functions)
      expect(result.query?.function_score.query.bool.must).toContainEqual({
        match: { title: { query: 'test' } },
      })
    })
  })

  describe('Constant Score', () => {
    it('should apply constant_score', () => {
      const result = builder
        .term('status', 'published')
        .constantScore(1.2)
        .build()

      expect(result.query).toHaveProperty('constant_score')
      expect(result.query?.constant_score.boost).toBe(1.2)
      expect(result.query?.constant_score.filter.bool.filter).toContainEqual({
        term: { 'status.keyword': 'published' },
      })
    })
  })

  describe('Query Utilities', () => {
    it('should validate query structure', () => {
      const validQuery = builder.match('title', 'test')
      const validation = validQuery.validate()

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect validation errors', () => {
      expect(() => {
        builder.from(-1)
      }).toThrow('from parameter must be a non-negative integer')
    })

    it('should calculate query complexity', () => {
      const complexity = builder
        .match('title', 'test')
        .term('status', 'published')
        .termsAgg('categories', 'category')
        .sort('created_at', 'desc')
        .getComplexity()

      expect(complexity).toBeGreaterThan(1)
    })

    it('should export to JSON', () => {
      const query = builder.match('title', 'test')
      const json = query.toJSON()
      const parsed = JSON.parse(json)

      expect(parsed).toEqual(query.build())
    })

    it('should export to pretty JSON', () => {
      const query = builder.match('title', 'test')
      const prettyJson = query.toJSON(true)

      expect(prettyJson).toContain('\n')
      expect(prettyJson).toContain('  ')
    })

    it('should add explain flag', () => {
      const result = builder.match('title', 'test').explain().build()

      expect((result as any).explain).toBe(true)
    })

    it('should add profile flag', () => {
      const result = builder.match('title', 'test').profile().build()

      expect((result as any).profile).toBe(true)
    })
  })
})
