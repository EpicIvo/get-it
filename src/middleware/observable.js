const Observable = require('any-observable')
const objectAssign = require('object-assign')

module.exports = () => {
  if (!Observable) {
    throw new Error('`Observable` is not available in global scope, and no implementation is registered using any-observable')
  }

  return {
    onReturn: (channels, context) => new Observable(observer => {
      channels.error.subscribe(err => observer.error(err))
      channels.progress.subscribe(event => observer.next(objectAssign({type: 'progress'}, event)))
      channels.response.subscribe(response => {
        observer.next({type: 'response', response})
        observer.complete()
      })

      channels.request.publish(context)
      return () => channels.abort.publish()
    })
  }
}
