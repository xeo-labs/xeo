import { useCurrentUser } from 'hooks/useCurrentUser';
import { useRouter } from 'next/router';
import { isSprintEmbedded } from 'pages/team/[teamId]/sprint/[sprintId]';
import { ToastContainer } from 'react-toastify';
import { Footer } from './Footer/Footer';
import { Onboarding } from './Onboarding/Onboarding';
import { Sidebar } from './Sidebar/Sidebar';

export const PrivateAppWrapper: React.FunctionComponent = ({ children }) => {
  const { me, status } = useCurrentUser();
  const router = useRouter();
  const isEmbed = isSprintEmbedded(router);

  if (isEmbed) {
    return <>{children}</>;
  }

  if (status !== 'loading' && !me?.metadata) {
    return <Onboarding />;
  }

  return (
    <div className="h-screen flex flex-row">
      <Sidebar />
      <div className="grow overflow-y-auto">
        <div
          id="app-body-container"
          className="min-h-full bg-dark-200 dark:bg-dark-900 pb-12"
        >
          {children}
        </div>
        <Footer />
        <ToastContainer />
      </div>
    </div>
  );
};
