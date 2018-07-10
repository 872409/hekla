import * as React from 'react';
import { View, Text, Image, TouchableHighlight, TouchableWithoutFeedback, Share, TouchableOpacity, Platform } from 'react-native';
import openActionSheet from 'utils/openActionSheet';
import { autobind } from 'core-decorators';
import Item from 'stores/models/Item';
import { replyScreen, userScreen, storyScreen } from 'screens';
import FormatText from 'components/format-text/FormatText';
import Account from 'stores/Account';
import { theme, getVar } from 'styles';
const styles = theme(require('./Comment.styl'));

type IItemType = typeof Item.Type;

interface Props {
  key?: string;
  item: IItemType;
  parent?: IItemType;
  depth?: number;
  collapsed?: boolean;
  hidden?: boolean;
  metalinks?: boolean;
  numberOfLines?: number;
  onPress?: (Props) => void;
  card?: boolean;
  testID?: string;
}

export default class Comment extends React.PureComponent<Props> {

  @autobind
  onMorePress() {
    const { isUserVote, isUserFavorite, isUserHidden } = this.props.item;
    const options = [{
      id: 'vote',
      icon: require('assets/icons/32/arrow-up.png'),
      materialIcon: 'arrow-up',
      title: isUserVote ? 'Unvote' : 'Vote',
      titleTextAlignment: 0,
    }, {
      id: 'favorite',
      icon: require('assets/icons/32/star.png'),
      materialIcon: 'star-outline',
      title: isUserFavorite ? 'Unfavorite' : 'Favorite',
      titleTextAlignment: 0,
    }, {
      id: 'hide',
      icon: require('assets/icons/32/hide.png'),
      materialIcon: isUserHidden ? 'eye-outline' : 'eye-off-outline',
      title: isUserHidden ? 'Unhide' : 'Hide',
      titleTextAlignment: 0,
    }, {
      id: 'reply',
      icon: require('assets/icons/32/reply.png'),
      materialIcon: 'reply',
      title: 'Reply',
      titleTextAlignment: 0,
    }, {
      id: 'user',
      icon: require('assets/icons/32/user.png'),
      materialIcon: 'account',
      title: this.props.item.by,
      titleTextAlignment: 0,
    }, {
      id: 'share',
      icon: require('assets/icons/32/share.png'),
      materialIcon: 'share',
      title: 'Share',
      titleTextAlignment: 0,
    }];

    if (Account.isLoggedIn && this.props.item.by === Account.user.id) {
      options.push({
        id: 'edit',
        title: 'Edit',
        titleTextAlignment: 0,
      } as any);
      options.push({
        id: 'delete',
        title: 'Delete',
        titleTextAlignment: 0,
      } as any);
    }

    const title = Platform.OS === 'android' ? 'Comment' : undefined;

    openActionSheet({ options, title, sheet: true, cancel: 'Cancel' }, this.onActionSelect);
  }

  onActionSelect({ id }) {
    if (id === 'vote') {
      this.props.item.vote();
    }
    if (id === 'favorite') {
      this.props.item.favorite();
    }
    if (id === 'hide') {
      this.props.item.hide();
    }
    if (id === 'reply') {
      replyScreen(this.props.item.id);
    }
    if (id === 'user') {
      userScreen(this.props.item.by);
    }
    if (id === 'share') {
      Share.share({
        message: this.props.item.prettyText,
      });
    }
    if (this.props.item.by === Account.user.id) {
      if (id === 'edit') {
        replyScreen(this.props.item.id, true);
      }
      if (id === 'delete') {
        this.onDelete();
      }
    }
  }

  @autobind
  async onPress() {
    const { onPress } = this.props;
    if (typeof onPress === 'function') {
      return onPress(this.props);
    }

    const getRoot = item => new Promise((resolve) => {
      if (item.parent && item.type !== 'story') {
        return item.fetchParent().then((parent) => {
          if (parent) {
            return getRoot(parent);
          }
        })
        .then(resolve);
      }
      resolve(item);
    });

    const root = await getRoot(this.props.item) as IItemType;

    return storyScreen(root);
  }

  @autobind
  onUserPress() {
    userScreen(this.props.item.by);
  }

  @autobind
  async onDelete() {
    this.props.item.delete();
  }

  renderParent() {
    if (this.props.collapsed || !this.props.parent) {
      return null;
    }

    const { text, prettyText, title, by } = this.props.parent;
    return (
      <View style={styles.parent}>
        {text ? (
          <FormatText
            noLinks={true}
            noFormat={true}
            numberOfLines={5}
            style={styles.parent__text}
          >
            {prettyText}
          </FormatText>
        ) : (
          <Text style={styles.parent__title}>{title}</Text>
        )}
        <Text style={styles.parent__author}>{by}</Text>
      </View>
    );
  }

  render() {
    const {
      hidden = false,
      collapsed = false,
      card = false,
      metalinks = true,
      depth = 0,
      numberOfLines,
      item,
    } = this.props;
    const { ago, by, isUserVote } = item;

    if (!by || hidden) {
      return null;
    }

    return (
      <TouchableHighlight
        onPress={this.onPress}
        onLongPress={this.onMorePress}
        activeOpacity={1}
        underlayColor={getVar('--content-bg-active-color')}
        style={[styles.host, card && styles.host__card]}
      >
        <View style={[styles.container, styles[`level${depth}`]]}>
          <View style={[styles.row, !collapsed && styles.row__expanded]}>
            <TouchableOpacity onPress={this.onUserPress}>
              <Text style={styles.author}>{by}</Text>
            </TouchableOpacity>
            {isUserVote && <Image style={styles.icon__arrow} source={require('assets/icons/16/arrow-up.png')} />}
            <View style={styles.flex} />
            {!collapsed && (
              <TouchableWithoutFeedback onPress={this.onMorePress}>
                <Image source={require('assets/icons/16/more.png')} style={styles.icon__more} />
              </TouchableWithoutFeedback>
            )}
            {!collapsed && <Text style={styles.ago}>{ago}</Text>}
            {collapsed && <Image source={require('assets/icons/16/chevron-down.png')} style={styles.icon__expand} />}
          </View>
          {!collapsed && (
            <FormatText
              style={styles.text}
              numberOfLines={numberOfLines}
              noLinks={!metalinks}
            >
              {item.prettyText}
            </FormatText>
          )}
          {this.renderParent()}
        </View>
      </TouchableHighlight>
    );
  }
}
