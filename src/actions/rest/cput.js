import createRestAction from '../../utils/http/create-action.js';

export default createRestAction({
  command: 'cput',
  method: 'PUT',
  describe: 'performs a PUT request',
  hasBody: true,
});
