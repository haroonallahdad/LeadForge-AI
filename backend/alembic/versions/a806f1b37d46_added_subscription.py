"""added_subscription

Revision ID: a806f1b37d46
Revises: b927ac09f067
Create Date: 2026-06-19 12:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a806f1b37d46'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add subscription_plan to users
    op.add_column('users', sa.Column('subscription_plan', sa.String(length=50), server_default='FREE', nullable=True))
    
    # Create payment_proofs table
    op.create_table(
        'payment_proofs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('plan_requested', sa.String(length=50), nullable=False),
        sa.Column('proof_image_base64', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='PENDING', nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('payment_proofs')
    op.drop_column('users', 'subscription_plan')
