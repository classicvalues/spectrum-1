// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import compose from 'recompose/compose';
import StripeCheckout from 'react-stripe-checkout';
import { PUBLIC_STRIPE_KEY } from '../../../api/constants';
import upgradeCommunityMutation from 'shared/graphql/mutations/community/upgradeCommunity';
import type { GetCommunityType } from 'shared/graphql/queries/community/getCommunity';
import { addToastWithTimeout } from '../../../actions/toasts';
import { openModal } from '../../../actions/modals';
import { NullCard } from '../../../components/upsell';
import { Button } from '../../../components/buttons';
import { Pitch, PitchItem, Cost, CostNumber, CostSubtext } from '../style';
import { SectionTitle } from '../../../components/settingsViews/style';

type State = {
  upgradeError: string,
  isLoading: boolean,
};

type Props = {
  community: GetCommunityType,
  upgradeCommunity: Function,
  complete: Function,
  dispatch: Function,
};

class UpsellUpgradeCommunityPure extends React.Component<Props, State> {
  state = {
    upgradeError: '',
    isLoading: false,
  };

  upgradeToPro = token => {
    this.setState({
      isLoading: true,
    });

    const input = {
      plan: 'community-standard',
      token: JSON.stringify(token),
      communityId: this.props.community.id,
    };

    this.props
      .upgradeCommunity(input)
      .then(() => {
        this.props.dispatch(addToastWithTimeout('success', 'Upgraded to Pro!'));
        this.setState({
          isLoading: false,
          upgradeError: '',
        });
        // if the upgrade is triggered from a modal, close the modal
        return this.props.complete && this.props.complete();
      })
      .catch(err => {
        this.setState({
          isLoading: false,
          upgradeError: err.message,
        });
        this.props.dispatch(addToastWithTimeout('error', err.message));
      });
  };

  render() {
    const { isLoading } = this.state;
    const { community } = this.props;

    return (
      <div>
        <SectionTitle>Upgrade to Spectrum Standard</SectionTitle>
        <Cost>
          <CostNumber per="month">
            {Math.ceil(community.metaData.members / 1000) * 100}
          </CostNumber>
          <CostSubtext>$100/month/1k community members</CostSubtext>
        </Cost>
        <Pitch>
          <PitchItem>
            <div>
              <span role="img" aria-label="lock emoji">
                🔐
              </span>
            </div>
            <p>
              Create <b>private channels</b> and invite individual members of
              your community
            </p>
          </PitchItem>
          <PitchItem>
            <div>
              <span role="img" aria-label="heart emoji">
                ❤️
              </span>
            </div>
            <p>
              Get <b>priority support</b> from the Spectrum team - even on the
              little stuff!
            </p>
          </PitchItem>
          <PitchItem>
            <div>
              <span role="img" aria-label="heart envelope emoji">
                💌
              </span>
            </div>
            <p>
              As always, there are <b>no limits</b> on channels, threads, and
              messages to slow you down.
            </p>
          </PitchItem>
        </Pitch>

        <StripeCheckout
          token={this.upgradeToPro}
          stripeKey={PUBLIC_STRIPE_KEY}
          name="🔐   Pay Securely"
          description="Secured and Encrypted by Stripe"
          panelLabel="Subscribe for "
          amount={Math.ceil(community.metaData.members / 1000) * 10000}
          currency="USD"
        >
          <Button
            disabled={isLoading}
            loading={isLoading}
            style={{ width: '100%' }}
          >
            Upgrade your community
          </Button>
        </StripeCheckout>
      </div>
    );
  }
}

export const UpsellUpgradeCommunity = compose(
  upgradeCommunityMutation,
  connect()
)(UpsellUpgradeCommunityPure);

type PrivateProps = {
  currentUser: ?Object,
  community: {
    name: string,
    communityPermissions: {
      isOwner: boolean,
      isMember: boolean,
    },
  },
  dispatch: Function,
};
class UpsellUpgradeCommunityPrivateChannelPure extends React.Component<
  PrivateProps
> {
  openCommunityUpgradeModal = () => {
    const { currentUser, community } = this.props;

    this.props.dispatch(
      openModal('COMMUNITY_UPGRADE_MODAL', { user: currentUser, community })
    );
  };

  render() {
    const { community } = this.props;

    const str = community.communityPermissions.isOwner
      ? 'Private channels are only available to communities on the Standard plan. Upgrade your community to re-activate this channel.'
      : `Private channels are only available to communities on the Standard plan. The owner of the ${
          community.name
        } community can upgrade it from the community settings page.`;

    return (
      <NullCard heading="This channel has been closed." copy={str}>
        {community.communityPermissions.isOwner && (
          <Button onClick={this.openCommunityUpgradeModal}>
            Upgrade {community.name} to Standard
          </Button>
        )}
      </NullCard>
    );
  }
}

const mapUpgrade = state => ({ currentUser: state.users.currentUser });
export const UpsellUpgradeCommunityPrivateChannel = compose(
  // $FlowIssue
  connect(mapUpgrade)
)(UpsellUpgradeCommunityPrivateChannelPure);