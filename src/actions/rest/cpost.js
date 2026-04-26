import createRestAction from '../../utils/http/create-action.js';

export default createRestAction({
  command: 'cpost',
  method: 'POST',
  describe: 'performs a POST request',
  hasBody: true,
});
