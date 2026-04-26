import createRestAction from '../../utils/http/create-action.js';

export default createRestAction({
  command: 'cget',
  method: 'GET',
  describe: 'performs a GET request',
  hasBody: false,
});
