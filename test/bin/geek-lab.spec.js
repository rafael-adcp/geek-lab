const execSync = require('child_process').execSync;
const expect = require('expect');

describe('#bin', () => {
  it('should show help if nothing is provided', (done) => {
    try {
      execSync('geek-lab');
      done('this shouldnt happen');
    } catch (e) {
      expect(e.toString()).toContain('<command>');
      expect(e.toString()).toContain('--help');
      expect(e.toString()).toContain('--version');
      expect(e.toString()).not.toContain('invalid command');
      expect(e.toString()).not.toContain('see available');
      done();
    }
  });

  it('should show help if --help is provided', () => {
    const res = execSync('geek-lab --help').toString();

    expect(res).toContain('<command>');
    expect(res).toContain('--help');
    expect(res).toContain('--version');
    expect(res).not.toContain('invalid command');
    expect(res).not.toContain('see available');
  });

  it('should show version if --version is provided', () => {
    const res = execSync('geek-lab --version').toString();

    expect(res).not.toContain('<command>');
    expect(res).not.toContain('--help');
    expect(res).not.toContain('invalid command');
    expect(res).not.toContain('see available');
    expect(res).toContain(require('../../package.json').version);
  });

  it('should show invalid command phrase + help when invalid command is provided', () => {
    try {
      execSync('geek-lab batmanrobin');
    }
    catch (res) {
      expect(res.toString()).toContain('Invalid command provided');
      expect(res.toString()).toContain('see available options below');
      expect(res.toString()).toContain('[command]');
      expect(res.toString()).toContain('--help');
      expect(res.toString()).toContain('--version');

    }
  });
});