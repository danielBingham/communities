/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media
 *  Copyright (C) 2022 - 2024 Daniel Bingham
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/

/******************************************************************************
 * User Fixtures for use in the integration test suite
 * ****************************************************************************/

const dictionary = {
  'user1': {
    id: '472eefbe-a019-45ee-bd3e-cb0eb0ba4b93',
    fileId: null,
    name: 'Test User1',
    username: 'test-user1',
    email: 'communities-test-user1@mailinator.com',
    password: 'PasswordPassword',
    birthdate: null,
    status: 'confirmed',
    permissions: 'user',
    siteRole: 'user',
    settings: null,
    notices: null,
    about: null,
    location: null,
    invitations: null,
    siteModerationId: null,
    privacyViewFriends: null,
    privacyViewMutualFriends: null,
    lastAuthenticationAttemptDate: null,
    authenticationMultifactorState: null,
    createdDate: '2026-07-21T01:48:04.949Z',
    updatedDate: '2026-07-21T01:48:30.679Z'
  }
}

module.exports = dictionary
