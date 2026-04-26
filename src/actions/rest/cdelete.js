import createRestAction from '../../utils/http/create-action.js';

export default createRestAction({
  command: 'cdelete',
  method: 'DELETE',
  describe: 'performs a DELETE request',
  hasBody: false,
});
