"""Add extra hours column to the table

Revision ID: 1677c4aeada0
Revises: 84061743b816
Create Date: 2024-11-07 14:13:09.244982

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1677c4aeada0'
down_revision: Union[str, None] = '84061743b816'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('daily_presence', sa.Column('extra_hours', sa.Time(), nullable=True))
    op.alter_column('hours_default', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('hours_default', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.drop_column('daily_presence', 'extra_hours')
    # ### end Alembic commands ###
