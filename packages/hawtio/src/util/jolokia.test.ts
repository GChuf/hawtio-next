import { IJolokiaSimple } from '@jolokia.js/simple'
import { JolokiaRequest } from 'jolokia.js'
import {
  operationToString,
  sendProcessingParametersInBody,
  splitProcessingParameters,
  withProcessingParameters,
} from './jolokia'

describe('jolokia', () => {
  test('operationToString', () => {
    expect(operationToString('getCamelId', [])).toEqual('getCamelId()')
    expect(
      operationToString('browseMessageAsXml', [
        {
          name: 'p1',
          type: 'java.lang.Integer',
          desc: '',
        },
        {
          name: 'p2',
          type: 'java.lang.Boolean',
          desc: '',
        },
      ]),
    ).toEqual('browseMessageAsXml(java.lang.Integer,java.lang.Boolean)')
  })

  test('splitProcessingParameters', () => {
    const { parameters, options } = splitProcessingParameters({
      method: 'post',
      maxDepth: 7,
      canonicalNaming: false,
      ignoreErrors: undefined,
    })
    expect(parameters).toEqual({ maxDepth: 7, canonicalNaming: false })
    expect(options).toEqual({ method: 'post' })
  })

  test('withProcessingParameters', () => {
    const request: JolokiaRequest = { type: 'version', config: { maxDepth: 2 } }
    expect(withProcessingParameters(request, { maxDepth: 7, ignoreErrors: true })).toEqual({
      type: 'version',
      config: { maxDepth: 2, ignoreErrors: true },
    })
    expect(withProcessingParameters([{ type: 'version' }, { type: 'search', mbean: '*:*' }], { maxDepth: 7 })).toEqual([
      { type: 'version', config: { maxDepth: 7 } },
      { type: 'search', mbean: '*:*', config: { maxDepth: 7 } },
    ])
    expect(withProcessingParameters(request, {})).toBe(request)
  })

  test('sendProcessingParametersInBody', () => {
    const request = jest.fn()
    const register = jest.fn()
    const jolokia = sendProcessingParametersInBody({ request, register } as unknown as IJolokiaSimple, {
      maxDepth: 7,
      canonicalNaming: false,
    })

    jolokia.request({ type: 'version' }, { method: 'post', maxDepth: 9, ignoreErrors: true })
    expect(request).toHaveBeenLastCalledWith(
      { type: 'version', config: { maxDepth: 9, canonicalNaming: false, ignoreErrors: true } },
      { method: 'post' },
    )

    // GET requests have no body
    jolokia.request({ type: 'version' }, { method: 'get' })
    expect(request).toHaveBeenLastCalledWith(
      { type: 'version' },
      { maxDepth: 7, canonicalNaming: false, method: 'get' },
    )

    const callback = jest.fn()
    jolokia.register(callback, { type: 'version' })
    expect(register).toHaveBeenLastCalledWith(callback, {
      type: 'version',
      config: { maxDepth: 7, canonicalNaming: false },
    })
  })
})
