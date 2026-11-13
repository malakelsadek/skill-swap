/** Clears the call history of every Jasmine spy inside the given (possibly nested) mock objects. */
export function resetSpies(...mocks: object[]): void {
  const reset = (value: unknown): void => {
    if (typeof value === 'function' && 'calls' in value) (value as jasmine.Spy).calls.reset();
    else if (value && typeof value === 'object') Object.values(value).forEach(reset);
  };
  mocks.forEach(reset);
}
