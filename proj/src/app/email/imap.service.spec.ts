import { TestBed } from '@angular/core/testing';

import { ImapService } from './imap.service';

describe('ImapService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ImapService = TestBed.get(ImapService);
    expect(service).toBeTruthy();
  });
});
