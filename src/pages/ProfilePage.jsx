import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { FIXTURES, USER_ROLES } from '../fixtures/fixtures.js';
import { useAppContext } from '../state/AppProvider.jsx';
import { formatCurrency, maskIdentifier } from '../utils/formatters.js';

function getInitials(persona) {
  const name = persona?.name || '';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'NB';
}

function ProfileField({ label, value }) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-nova-slate">
        {label}
      </p>
      <p className="mt-1 font-semibold text-nova-midnight">{value}</p>
    </div>
  );
}

/**
 * Shows the signed-in demonstration profile, accounts, and workshop roles.
 *
 * @returns {JSX.Element}
 */
function ProfilePage() {
  const { persona, session } = useAppContext();
  const personaId = persona?.id || session?.userId || '';
  const profile =
    FIXTURES.personas.find((item) => item.id === personaId) || persona;

  const accounts = useMemo(
    () => FIXTURES.accounts.filter((account) => account.userId === profile?.id),
    [profile?.id],
  );

  if (!profile) {
    return (
      <main className="page-container">
        <section className="surface-card px-6 py-12">
          <h1 className="text-3xl font-bold text-nova-midnight">Profile</h1>
          <p className="mt-3 text-nova-slate">
            Sign in with a demonstration customer to view profile details.
          </p>
        </section>
      </main>
    );
  }

  const userId = profile.username || profile.id;

  return (
    <main className="page-container" data-testid="profile-page">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-nova-navy text-xl font-bold text-[#DCB91C]"
          >
            {getInitials(profile)}
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
              Customer profile
            </p>
            <h1 className="mt-1 text-3xl font-bold text-nova-midnight sm:text-4xl">
              {profile.name}
            </h1>
            <p className="mt-1 text-sm font-semibold text-nova-navy">
              {profile.role || 'Retail Banking Customer'}
            </p>
          </div>
        </div>
        <p className="max-w-md text-sm text-nova-slate">
          {profile.profileSummary}
        </p>
      </header>

      <section aria-labelledby="profile-details-title" className="mb-8">
        <h2
          id="profile-details-title"
          className="mb-4 text-2xl font-bold text-nova-midnight"
        >
          Profile details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileField label="Greeting" value={profile.greeting} />
          <ProfileField label="User ID" value={userId} />
          <ProfileField
            label="Masked user ID"
            value={maskIdentifier(profile.id)}
          />
          <ProfileField label="Email" value={profile.email} />
          <ProfileField label="Phone" value={profile.phone} />
          <ProfileField label="Address" value={profile.address} />
          <ProfileField label="Member since" value={profile.memberSince} />
          <ProfileField label="Last login" value={profile.lastLoginLabel} />
          <ProfileField
            label="Relationship total"
            value={formatCurrency(profile.relationshipTotal, 'PHP')}
          />
        </div>
      </section>

      <section aria-labelledby="profile-accounts-title" className="mb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2
            id="profile-accounts-title"
            className="text-2xl font-bold text-nova-midnight"
          >
            Customer accounts
          </h2>
          <NavLink
            to="/accounts"
            className="text-sm font-semibold text-nova-blue underline-offset-2 hover:underline"
          >
            View all accounts
          </NavLink>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => (
            <article key={account.id} className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-nova-midnight">
                    {account.name}
                  </h3>
                  <p className="mt-1 text-sm text-nova-slate">
                    {account.maskedAccountNumber} · {account.accountCategory || account.type}
                  </p>
                </div>
                <span className="rounded-full bg-nova-mint px-3 py-1 text-xs font-bold text-nova-teal">
                  Active
                </span>
              </div>
              <p className="mt-4 text-xl font-bold text-nova-midnight">
                {account.type === 'credit'
                  ? `Amount due ${formatCurrency(account.amountDue, account.currency)}`
                  : account.type === 'loan'
                    ? `Outstanding ${formatCurrency(account.outstandingPrincipal, account.currency)}`
                    : `Available ${formatCurrency(account.availableBalance, account.currency)}`}
              </p>
              <NavLink
                to={`/accounts/${account.id}`}
                className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-nova-navy underline-offset-2 hover:underline"
              >
                View details
              </NavLink>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="demo-roles-title">
        <h2
          id="demo-roles-title"
          className="mb-2 text-2xl font-bold text-nova-midnight"
        >
          Target users and personas
        </h2>
        <p className="mb-4 max-w-3xl text-sm text-nova-slate">
          These demonstration roles describe how the workshop uses the portal.
          Miguel and Rosa sign in as retail banking customers. Product and
          support journeys use the same profile. Facilitator controls are in
          the profile menu.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {USER_ROLES.map((role) => {
            const isActive = role.id === profile.roleId;

            return (
              <article
                key={role.id}
                className={[
                  'surface-card p-5',
                  isActive ? 'border-2 border-nova-navy' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-nova-midnight">
                    {role.name}
                  </h3>
                  {isActive && (
                    <span className="rounded-full bg-[#FFEDED] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-nova-navy">
                      Active profile
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-nova-slate">
                  {role.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export { ProfilePage };
export default ProfilePage;
