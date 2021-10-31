import { gql } from '@apollo/client';
import classNames from 'classnames';
import ContentBlockList from 'components/Blocks/ContentBlock/ContentBlockList/ContentBlockList';
import { Clickable } from 'components/UI/Clickable/Clickable';
import { Dropdown } from 'components/UI/Dropdown/Dropdown';
import { useGetBlockQuery } from 'generated';
import { FiTrash } from 'react-icons/fi';
import { PageTitle } from './PageTitle/PageTitle';

interface Props {
  blockId: string;
}

export const GET_BLOCK = gql`
  fragment PageChildren on Block {
    __typename
    id
    type
    ... on PageBlock {
      title
      description
      emoji
      favourite
    }
    ... on TextBlock {
      text
    }
  }

  query GetBlock($blockId: ID!) {
    block(id: $blockId) {
      __typename
      id
      type
      ... on PageBlock {
        title
        description
        emoji
        favourite
        children {
          ...PageChildren
        }
      }
    }
  }
`;

export const Page: React.FunctionComponent<Props> = ({ blockId }) => {
  const { data } = useGetBlockQuery({ variables: { blockId } });

  const page = data?.block;

  if (!page || page.__typename !== 'PageBlock') {
    return null;
  }

  return (
    <div className="page min-h-full flex flex-col">
      <Dropdown
        button={
          <Clickable className="text-7xl mb-6 mt-12 p-2 w-min select-none">
            <div className="text-7xl">{page.emoji}</div>
          </Clickable>
        }
        items={[[{ text: 'Remove', logo: <FiTrash /> }]]}
        showDirection="right"
      />

      <PageTitle page={page} />
      {page.children && <ContentBlockList blocks={page.children} />}
    </div>
  );
};
