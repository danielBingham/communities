import { resetBlocklistSlice } from '/state/Blocklist'
import { cleanFileCache } from '/state/File'
import { resetGroupSlice } from '/state/Group'
import { resetGroupMemberSlice } from '/state/GroupMember'
import { resetGroupModerationSlice } from '/state/GroupModeration'
import { resetGroupSubscriptionSlice } from '/state/GroupSubscription'
import { resetLinkPreviewSlice } from '/state/LinkPreview'
import { resetPostSlice } from '/state/Post'
import { resetPostCommentSlice } from '/state/PostComment'
import { resetPostReactionSlice } from '/state/PostReaction'
import { resetPostSubscriptionSlice } from '/state/PostSubscription'
import { resetSiteModerationSlice } from '/state/SiteModeration'
import { resetUserSlice } from '/state/User'
import { resetUserRelationshipSlice } from '/state/UserRelationship'

export const resetEntities = function() {
    return function(dispatch, getState) {
        dispatch(resetBlocklistSlice())
        dispatch(cleanFileCache())
        dispatch(resetGroupSlice())
        dispatch(resetGroupMemberSlice())
        dispatch(resetGroupModerationSlice())
        dispatch(resetGroupSubscriptionSlice())
        dispatch(resetLinkPreviewSlice())
        dispatch(resetPostSlice())
        dispatch(resetPostCommentSlice())
        dispatch(resetPostReactionSlice())
        dispatch(resetPostSubscriptionSlice())
        dispatch(resetSiteModerationSlice())
        dispatch(resetUserSlice())
        dispatch(resetUserRelationshipSlice())
    }
}
